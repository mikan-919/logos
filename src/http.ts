import { LogosKernel, ValidationError } from "./kernel";

const json = (value: unknown, status = 200): Response =>
  Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
  });

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Logos · Semantic Review</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui; background: #0d0f0e; color: #ecf0e9; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 85% 5%, #26372e 0, transparent 34rem), #0d0f0e; }
    main { width: min(1080px, calc(100% - 40px)); margin: 0 auto; padding: 64px 0; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: end; border-bottom: 1px solid #3a423c; padding-bottom: 24px; }
    h1 { margin: 0; font: 500 clamp(2rem, 5vw, 4.5rem)/.95 Georgia, serif; letter-spacing: -.04em; }
    .eyebrow, .meta { color: #a5b0a8; font: 600 11px/1.4 ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
    section { padding-top: 36px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
    article { background: #171b18cc; border: 1px solid #303832; border-radius: 12px; padding: 20px; }
    h2, h3, p { margin-top: 0; } h3 { font-size: 16px; }
    .confidence { color: #bce8c9; }
    button { border: 1px solid #637269; border-radius: 999px; padding: 8px 14px; color: inherit; background: transparent; cursor: pointer; }
    button.primary { background: #d9efdf; color: #102016; border-color: #d9efdf; }
    .actions { display: flex; gap: 8px; margin-top: 18px; }
    .empty { color: #8f9a92; border: 1px dashed #3a423c; border-radius: 12px; padding: 32px; }
  </style>
</head>
<body><main>
  <header><div><div class="eyebrow">Logos / Local workspace</div><h1>Semantic Review</h1></div><div class="meta" id="summary">Loading…</div></header>
  <section><h2>Unresolved hypotheses</h2><div class="grid" id="queue"></div></section>
</main>
<script>
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function review(id, decision) { await fetch('/api/hypotheses/' + id + '/' + decision, { method: 'POST' }); await load(); }
async function load() {
  const [{hypotheses}, {entities}] = await Promise.all([fetch('/api/hypotheses?status=candidate').then(r=>r.json()), fetch('/api/entities').then(r=>r.json())]);
  const names = Object.fromEntries(entities.map(e => [e.id, e.title]));
  document.querySelector('#summary').textContent = hypotheses.length + ' awaiting review';
  document.querySelector('#queue').innerHTML = hypotheses.length ? hypotheses.map(h => '<article><div class="meta">' + escapeHtml(h.relationType) + '</div><h3>' + escapeHtml(names[h.fromEntityId] || h.fromEntityId) + ' → ' + escapeHtml(names[h.toEntityId] || h.toEntityId) + '</h3><p class="confidence">' + Math.round(h.confidence * 100) + '% confidence · ' + escapeHtml(h.resolver) + '</p><div class="actions"><button class="primary" onclick="review(\'' + h.id + '\', \'accept\')">Accept</button><button onclick="review(\'' + h.id + '\', \'reject\')">Reject</button></div></article>').join('') : '<div class="empty">No unresolved hypotheses.</div>';
}
load();
</script></body></html>`;

export function createHttpApp(workspace: string): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      const kernel = await LogosKernel.open(workspace);
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
