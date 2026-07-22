import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-workflow-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("CLI workflow", () => {
  test("imports Linear and GitHub data, resolves explicit references, and explains the evidence", async () => {
    const root = await workspace();
    const linearPath = join(root, "linear.json");
    const githubPath = join(root, "github.json");
    await writeFile(
      linearPath,
      JSON.stringify({
        projects: [{ id: "project-1", key: "ENG", name: "Engineering" }],
        issues: [
          { id: "linear-142", identifier: "ENG-142", title: "Cache policy", projectId: "project-1" },
        ],
      }),
    );
    await writeFile(
      githubPath,
      JSON.stringify({
        repositories: [{ id: "repo-1", name: "acme/api", url: "https://github.com/acme/api" }],
        branches: [
          { id: "branch-1", name: "feature/ENG-142-cache-policy", repositoryId: "repo-1" },
        ],
        pullRequests: [
          {
            id: "pr-8",
            number: 8,
            title: "Add cache policy",
            body: "Implements ENG-142",
            url: "https://github.com/acme/api/pull/8",
            repositoryId: "repo-1",
            branchId: "branch-1",
          },
        ],
      }),
    );

    expect(await runCli(["import", "linear", linearPath], { cwd: root })).toMatchObject({ imported: 2 });
    expect(await runCli(["import", "github", githubPath], { cwd: root })).toMatchObject({ imported: 3 });
    const resolution = await runCli(["resolve"], { cwd: root });
    expect(resolution).toMatchObject({ proposed: 2 });

    const hypotheses = (await runCli(["hypothesis", "list"], { cwd: root })) as {
      hypotheses: Array<{ id: string; relationType: string; evidenceIds: string[] }>;
    };
    expect(hypotheses.hypotheses).toHaveLength(2);
    expect(hypotheses.hypotheses.every((item) => item.relationType === "implements")).toBe(true);

    const explanation = (await runCli(["explain", hypotheses.hypotheses[0]!.id], { cwd: root })) as {
      evidence: Array<{ resolver?: string }>;
    };
    expect(explanation.evidence[0]?.resolver).toBe("explicit-reference/v1");
  });

  test("starts work from an external identity and returns bounded agent context", async () => {
    const root = await workspace();
    const entity = (await runCli(["entity", "create", "WorkItem", "Cache policy"], { cwd: root })) as {
      id: string;
    };
    await runCli(
      ["component", "add", entity.id, "LinearIssue", "--provider", "linear", "--external-id", "ENG-142"],
      { cwd: root },
    );
    await runCli(["work", "start", "ENG-142"], { cwd: root });

    const context = (await runCli(["agent", "context"], { cwd: root })) as {
      active: { workItemId?: string };
      entities: Array<{ id: string }>;
    };
    expect(context.active.workItemId).toBe(entity.id);
    expect(context.entities.map((item) => item.id)).toEqual([entity.id]);
  });

  test("accepts a hypothesis through the review CLI", async () => {
    const root = await workspace();
    const work = (await runCli(["entity", "create", "WorkItem", "Cache policy"], { cwd: root })) as {
      id: string;
    };
    const branch = (await runCli(["entity", "create", "Branch", "feature/cache"], { cwd: root })) as {
      id: string;
    };
    const evidence = (await runCli(
      ["evidence", "add", "local-rule", "Branch name matches work item"],
      { cwd: root },
    )) as { id: string };
    const hypothesis = (await runCli(
      [
        "hypothesis",
        "propose",
        branch.id,
        "implements",
        work.id,
        "--evidence",
        evidence.id,
        "--confidence",
        "0.9",
      ],
      { cwd: root },
    )) as { id: string };

    await runCli(["hypothesis", "accept", hypothesis.id], { cwd: root });
    const relations = (await runCli(["relation", "list"], { cwd: root })) as { relations: unknown[] };
    expect(relations.relations).toHaveLength(1);
  });

  test("matches complete external identifiers, not prefixes", async () => {
    const root = await workspace();
    const linearPath = join(root, "linear.json");
    const githubPath = join(root, "github.json");
    await writeFile(
      linearPath,
      JSON.stringify({ issues: [{ id: "14", identifier: "ENG-14", title: "Small task" }] }),
    );
    await writeFile(
      githubPath,
      JSON.stringify({
        repositories: [{ id: "repo", name: "acme/api" }],
        branches: [{ id: "branch", name: "feature/ENG-142-other", repositoryId: "repo" }],
      }),
    );
    await runCli(["import", "linear", linearPath], { cwd: root });
    await runCli(["import", "github", githubPath], { cwd: root });

    expect(await runCli(["resolve"], { cwd: root })).toMatchObject({ proposed: 0 });
  });

  test("starting different work clears the previous active branch and CLI delivery is audited", async () => {
    const root = await workspace();
    const first = (await runCli(["entity", "create", "WorkItem", "First"], { cwd: root })) as { id: string };
    const second = (await runCli(["entity", "create", "WorkItem", "Second"], { cwd: root })) as { id: string };
    await runCli(["work", "start", first.id], { cwd: root });
    await runCli(["branch", "register", "feature/first"], { cwd: root });
    await runCli(["work", "start", second.id], { cwd: root });
    const context = (await runCli(["context", "show"], { cwd: root })) as { branchId?: string; workItemId?: string };
    expect(context).toMatchObject({ workItemId: second.id });
    expect(context.branchId).toBeUndefined();

    await runCli(["agent", "context", "--operation", "implement"], { cwd: root });
    const kernel = await import("../src/kernel").then(({ LogosKernel }) => LogosKernel.open(root));
    expect(kernel.history().at(-1)?.type).toBe("agent.context_delivered");
  });

  test("refreshes changed connector data on repeated import", async () => {
    const root = await workspace();
    const linearPath = join(root, "linear.json");
    const exportWithStatus = (status: string) => ({
      issues: [{ id: "142", identifier: "ENG-142", title: "Cache policy", status }],
    });
    await writeFile(linearPath, JSON.stringify(exportWithStatus("Todo")));
    await runCli(["import", "linear", linearPath], { cwd: root });
    await writeFile(linearPath, JSON.stringify(exportWithStatus("Done")));
    expect(await runCli(["import", "linear", linearPath], { cwd: root })).toMatchObject({ reused: 1 });
    await runCli(["work", "start", "ENG-142"], { cwd: root });

    const context = (await runCli(["agent", "context"], { cwd: root })) as {
      components: Array<{ data: { status?: string } }>;
    };
    expect(context.components).toHaveLength(1);
    expect(context.components[0]?.data.status).toBe("Done");
  });
});
