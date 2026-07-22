import { resolve } from "node:path";
import { importGitHub, importLinear, resolveDeterministic } from "./connectors";
import { LogosKernel, ValidationError } from "./kernel";
import { dashboardPage } from "./ui";

const json = (value: unknown, status = 200): Response =>
  Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
  });

function overview(kernel: LogosKernel): Record<string, unknown> {
  const snapshot = kernel.snapshot();
  const entityById = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
  const evidenceById = new Map(snapshot.evidence.map((evidence) => [evidence.id, evidence]));
  const componentCount = new Map<string, number>();
  for (const component of snapshot.components) {
    componentCount.set(component.entityId, (componentCount.get(component.entityId) ?? 0) + 1);
  }
  const explainEvidence = (evidenceIds: string[]) => evidenceIds.flatMap((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);
    return evidence ? [evidence] : [];
  });
  return {
    metrics: {
      entities: snapshot.entities.length,
      components: snapshot.components.length,
      relations: snapshot.relations.length,
      candidates: snapshot.hypotheses.filter((hypothesis) => hypothesis.status === "candidate").length,
    },
    activeContext: kernel.agentContext(),
    entities: snapshot.entities.map((entity) => ({
      ...entity,
      componentCount: componentCount.get(entity.id) ?? 0,
    })),
    links: snapshot.relations.flatMap((relation) => {
      const from = entityById.get(relation.fromEntityId);
      const to = entityById.get(relation.toEntityId);
      return from && to ? [{ ...relation, from, to, evidence: explainEvidence(relation.evidenceIds) }] : [];
    }),
    hypotheses: snapshot.hypotheses
      .filter((hypothesis) => hypothesis.status === "candidate")
      .flatMap((hypothesis) => {
        const from = entityById.get(hypothesis.fromEntityId);
        const to = entityById.get(hypothesis.toEntityId);
        return from && to
          ? [{ ...hypothesis, from, to, evidence: explainEvidence(hypothesis.evidenceIds) }]
          : [];
      }),
    activity: kernel.history().slice(-12).reverse().map((event) => ({
      id: event.id,
      type: event.type,
      at: event.at,
    })),
  };
}

export function createHttpApp(workspace: string): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response(dashboardPage, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      const kernel = await LogosKernel.open(workspace);
      if (request.method === "GET" && url.pathname === "/api/overview") {
        return json(overview(kernel));
      }
      if (request.method === "GET" && url.pathname === "/api/entities") {
        return json({ entities: kernel.snapshot().entities });
      }
      if (request.method === "GET" && url.pathname === "/api/relations") {
        return json({ relations: kernel.snapshot().relations });
      }
      if (request.method === "GET" && url.pathname === "/api/hypotheses") {
        const status = url.searchParams.get("status");
        return json({
          hypotheses: kernel.snapshot().hypotheses.filter((hypothesis) => !status || hypothesis.status === status),
        });
      }
      if (request.method === "GET" && url.pathname === "/api/context") {
        return json(await kernel.deliverAgentContext("http-api"));
      }
      if (request.method === "POST" && url.pathname === "/api/resolve") {
        return json(await resolveDeterministic(kernel));
      }
      if (request.method === "POST" && url.pathname === "/api/demo") {
        const examples = resolve(import.meta.dir, "../examples");
        await importLinear(kernel, resolve(examples, "linear.json"));
        await importGitHub(kernel, resolve(examples, "github.json"));
        const resolution = await resolveDeterministic(kernel);
        const workItem = kernel.findByExternalIdentity("linear", "ENG-142");
        if (workItem) await kernel.setContext({ workItemId: workItem.id });
        return json({ loaded: true, ...resolution });
      }
      const workContext = url.pathname.match(/^\/api\/context\/work\/([^/]+)$/);
      if (request.method === "POST" && workContext) {
        const entityId = workContext[1]!;
        const entity = kernel.snapshot().entities.find((candidate) => candidate.id === entityId);
        if (!entity || entity.type !== "WorkItem") throw new ValidationError(`Unknown work item: ${entityId}`);
        const { branchId: _, updatedAt: __, ...current } = kernel.snapshot().context;
        return json(await kernel.setContext({ ...current, workItemId: entityId }));
      }
      const review = url.pathname.match(/^\/api\/hypotheses\/([^/]+)\/(accept|reject)$/);
      if (request.method === "POST" && review) {
        return json(await kernel.resolveHypothesis(review[1]!, review[2] === "accept" ? "accepted" : "rejected"));
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500;
      return json({ error: (error as Error).message }, status);
    }
  };
}

export function startHttpServer(workspace: string, port: number): ReturnType<typeof Bun.serve> {
  return Bun.serve({ port, fetch: createHttpApp(workspace) });
}
