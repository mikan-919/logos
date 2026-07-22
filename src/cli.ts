#!/usr/bin/env bun
import { resolve } from "node:path";
import { importGitHub, importLinear, resolveDeterministic } from "./connectors";
import { startHttpServer } from "./http";
import { LogosKernel, ValidationError } from "./kernel";
import { startMcpServer } from "./mcp";
import { ENTITY_TYPES, RELATION_TYPES, type ActiveContext, type EntityType, type EvidenceKind, type RelationType } from "./types";

interface CliOptions {
  cwd?: string;
}

function required(args: string[], index: number, label: string): string {
  const value = args[index];
  if (!value) throw new ValidationError(`Missing ${label}`);
  return value;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function entityType(value: string): EntityType {
  if (!ENTITY_TYPES.includes(value as EntityType)) throw new ValidationError(`Unsupported entity type: ${value}`);
  return value as EntityType;
}

function relationType(value: string): RelationType {
  if (!RELATION_TYPES.includes(value as RelationType)) throw new ValidationError(`Unsupported relation type: ${value}`);
  return value as RelationType;
}

function publicContext(context: ActiveContext): Omit<ActiveContext, "updatedAt"> {
  const { updatedAt: _, ...active } = context;
  return active;
}

export async function runCli(args: string[], options: CliOptions = {}): Promise<unknown> {
  const cwd = options.cwd ?? process.cwd();
  const kernel = await LogosKernel.open(cwd);
  const [group, action] = args;

  if (!group || group === "help" || group === "--help") return { usage: HELP };
  if (group === "init") return { workspace: cwd, eventStore: resolve(cwd, ".logos/events.jsonl") };

  if (group === "entity" && action === "create") {
    return kernel.createEntity(entityType(required(args, 2, "entity type")), required(args, 3, "title"));
  }
  if (group === "entity" && action === "list") {
    const type = args[2];
    return { entities: kernel.snapshot().entities.filter((entity) => !type || entity.type === type) };
  }
  if (group === "component" && action === "add") {
    const provider = option(args, "--provider") as "github" | "linear" | "local" | undefined;
    const externalId = option(args, "--external-id");
    const url = option(args, "--url");
    return kernel.attachComponent(required(args, 2, "entity ID"), {
      kind: required(args, 3, "component kind"),
      data: {},
      ...(provider ? { provider } : {}),
      ...(externalId ? { externalId } : {}),
      ...(url ? { url } : {}),
    });
  }
  if (group === "evidence" && action === "add") {
    return kernel.recordEvidence({
      kind: required(args, 2, "evidence kind") as EvidenceKind,
      description: required(args, 3, "description"),
      ...(option(args, "--source") ? { source: option(args, "--source")! } : {}),
    });
  }
  if (group === "relation" && action === "add") {
    const evidence = option(args, "--evidence");
    if (!evidence) throw new ValidationError("Missing --evidence");
    return kernel.createRelation(
      required(args, 2, "source entity ID"),
      relationType(required(args, 3, "relation type")),
      required(args, 4, "target entity ID"),
      evidence.split(","),
    );
  }
  if (group === "relation" && action === "list") return { relations: kernel.snapshot().relations };
  if (group === "hypothesis" && action === "propose") {
    const evidence = option(args, "--evidence");
    if (!evidence) throw new ValidationError("Missing --evidence");
    return kernel.proposeRelation({
      fromEntityId: required(args, 2, "source entity ID"),
      relationType: relationType(required(args, 3, "relation type")),
      toEntityId: required(args, 4, "target entity ID"),
      evidenceIds: evidence.split(","),
      confidence: Number(option(args, "--confidence") ?? "0.5"),
      resolver: option(args, "--resolver") ?? "manual-proposal/v1",
    });
  }
  if (group === "hypothesis" && action === "list") {
    const status = option(args, "--status");
    return {
      hypotheses: kernel.snapshot().hypotheses.filter((hypothesis) => !status || hypothesis.status === status),
    };
  }
  if (group === "hypothesis" && (action === "accept" || action === "reject")) {
    return kernel.resolveHypothesis(required(args, 2, "hypothesis ID"), action === "accept" ? "accepted" : "rejected");
  }
  if (group === "work" && action === "start") {
    const reference = required(args, 2, "work item ID or external identity");
    const entity = kernel.snapshot().entities.find((candidate) => candidate.id === reference)
      ?? kernel.findByExternalIdentity("linear", reference)
      ?? kernel.findByExternalIdentity("github", reference);
    if (!entity || entity.type !== "WorkItem") throw new ValidationError(`Unknown work item: ${reference}`);
    return kernel.setContext({ ...publicContext(kernel.snapshot().context), workItemId: entity.id });
  }
  if (group === "branch" && (action === "register" || action === "create")) {
    const name = required(args, 2, "branch name");
    const current = kernel.snapshot().context;
    if (!current.workItemId) throw new ValidationError("Start a work item before creating a branch");
    if (action === "create") {
      const process = Bun.spawn(["git", "switch", "-c", name], { cwd, stdout: "pipe", stderr: "pipe" });
      const exitCode = await process.exited;
      if (exitCode !== 0) throw new ValidationError(`git switch failed: ${await new Response(process.stderr).text()}`);
    }
    const existing = kernel.findByExternalIdentity("local", `git-branch:${name}`);
    const entity = existing ?? (await kernel.createEntity("Branch", name));
    if (!existing) {
      await kernel.attachComponent(entity.id, {
        kind: "LocalGitBranch",
        provider: "local",
        externalId: `git-branch:${name}`,
        data: { name },
      });
    }
    const evidence = await kernel.recordEvidence({
      kind: "operation",
      description: `Branch ${name} registered from active work item ${current.workItemId}`,
      source: `logos branch ${action}`,
    });
    const relation = await kernel.createRelation(entity.id, "implements", current.workItemId, [evidence.id]);
    await kernel.setContext({ ...publicContext(current), branchId: entity.id });
    return { entity, relation };
  }
  if (group === "context" && action === "set") {
    const kind = required(args, 2, "context kind");
    const entityId = required(args, 3, "entity ID");
    const field = ({ project: "projectId", work: "workItemId", repository: "repositoryId", branch: "branchId" } as const)[kind as "project" | "work" | "repository" | "branch"];
    if (!field) throw new ValidationError(`Unsupported context kind: ${kind}`);
    return kernel.setContext({ ...publicContext(kernel.snapshot().context), [field]: entityId });
  }
  if (group === "context" && action === "show") return kernel.snapshot().context;
  if (group === "agent" && action === "context") return kernel.agentContext();
  if (group === "import" && action === "linear") return importLinear(kernel, required(args, 2, "file path"));
  if (group === "import" && action === "github") return importGitHub(kernel, required(args, 2, "file path"));
  if (group === "resolve") return resolveDeterministic(kernel);
  if (group === "explain") {
    const target = required(args, 1, "relation or hypothesis ID");
    if (target.startsWith("rel_")) return kernel.explainRelation(target);
    const hypothesis = kernel.snapshot().hypotheses.find((candidate) => candidate.id === target);
    if (hypothesis) {
      return {
        hypothesis,
        evidence: hypothesis.evidenceIds.map((evidenceId) =>
          kernel.snapshot().evidence.find((candidate) => candidate.id === evidenceId),
        ),
      };
    }
    throw new ValidationError(`Unknown explainable object: ${target}`);
  }
  if (group === "merge") {
    const evidence = option(args, "--evidence");
    if (!evidence) throw new ValidationError("Missing --evidence");
    return { mergeId: await kernel.mergeEntity(required(args, 1, "source entity ID"), required(args, 2, "target entity ID"), evidence) };
  }
  if (group === "merge-revert") {
    await kernel.revertMerge(required(args, 1, "merge ID"));
    return { reverted: args[1] };
  }
  throw new ValidationError(`Unknown command: ${args.join(" ")}`);
}

const HELP = `logos commands:
  init
  import <linear|github> <export.json>
  resolve
  work start <entity-id|external-id>
  branch register <name>
  branch create <name>
  context show
  agent context
  entity create <type> <title>
  entity list [type]
  component add <entity-id> <kind> [--provider <provider>] [--external-id <id>]
  evidence add <kind> <description>
  relation add <from> <type> <to> --evidence <id[,id]>
  hypothesis list [--status candidate]
  hypothesis accept|reject <id>
  explain <relation-or-hypothesis-id>`;

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === "mcp") {
      await startMcpServer(process.cwd());
      process.exit(0);
    }
    if (args[0] === "serve") {
      const port = Number(option(args, "--port") ?? "4317");
      const server = startHttpServer(process.cwd(), port);
      console.log(`Logos review UI: ${server.url}`);
      await new Promise(() => {});
    }
    const result = await runCli(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: (error as Error).message }, null, 2));
    process.exitCode = 1;
  }
}
