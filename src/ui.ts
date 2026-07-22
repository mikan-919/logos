export const dashboardPage = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Inspect active work, semantic links, provenance, and unresolved hypotheses in Logos.">
  <meta name="theme-color" content="#11130f">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2311130f'/%3E%3Cpath d='M9 7v18h14' fill='none' stroke='%23b9d39b' stroke-width='3'/%3E%3C/svg%3E">
  <title>Logos · Semantic workspace</title>
  <style>
    :root {
      color-scheme: dark;
      --ink: #f2f0e8;
      --muted: #94998d;
      --faint: #686e64;
      --ground: #11130f;
      --surface: #191c17;
      --surface-raised: #20241e;
      --line: #343a31;
      --line-bright: #4a5347;
      --accent: #b9d39b;
      --accent-ink: #172010;
      --warning: #d8bc80;
      --danger: #d69a8f;
      --sans: "Avenir Next", Avenir, "Segoe UI", sans-serif;
      --display: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
      --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100dvh;
      color: var(--ink);
      background:
        radial-gradient(circle at 85% -10%, rgba(137, 164, 107, .16), transparent 34rem),
        linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px),
        var(--ground);
      background-size: auto, 32px 32px, 32px 32px, auto;
      font-family: var(--sans);
      line-height: 1.5;
    }
    button { font: inherit; }
    button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    .skip { position: fixed; left: 1rem; top: -4rem; z-index: 3; padding: .65rem 1rem; background: var(--accent); color: var(--accent-ink); }
    .skip:focus { top: 1rem; }
    .shell { width: min(1360px, calc(100% - 2.5rem)); margin: 0 auto; padding-bottom: 5rem; }
    .topbar { min-height: 5.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: .8rem; font-weight: 600; letter-spacing: -.02em; }
    .mark { width: 1.75rem; height: 1.75rem; display: grid; place-items: center; border: 1px solid var(--line-bright); border-radius: 50% 50% 44% 56%; font: italic 600 1rem/1 var(--display); color: var(--accent); }
    .status { display: flex; align-items: center; gap: .55rem; color: var(--muted); font: 500 .72rem/1 var(--mono); letter-spacing: .05em; }
    .status-dot { width: .45rem; height: .45rem; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 .28rem rgba(185,211,155,.1); }
    .masthead { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(18rem, .7fr); gap: 4rem; padding: 4.5rem 0 3rem; align-items: end; }
    .kicker, .label { color: var(--muted); font: 600 .68rem/1.3 var(--mono); letter-spacing: .11em; text-transform: uppercase; }
    h1 { max-width: 13ch; margin: .8rem 0 0; font: 500 clamp(3.25rem, 7vw, 6.7rem)/.88 var(--display); letter-spacing: -.055em; text-wrap: balance; }
    .masthead-copy { max-width: 33rem; color: #b5baaf; font-size: 1rem; text-wrap: pretty; }
    .toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; margin-top: 1.5rem; }
    .button { min-height: 2.65rem; padding: .68rem 1rem; border: 1px solid var(--line-bright); border-radius: .35rem; color: var(--ink); background: var(--surface); cursor: pointer; transition: transform 180ms ease, border-color 180ms ease, background 180ms ease; }
    .button:hover { border-color: #788274; background: var(--surface-raised); transform: translateY(-1px); }
    .button:active { transform: translateY(1px) scale(.99); }
    .button-primary { color: var(--accent-ink); border-color: var(--accent); background: var(--accent); font-weight: 600; }
    .button-primary:hover { color: var(--accent-ink); background: #cae2ad; border-color: #cae2ad; }
    .button-quiet { background: transparent; }
    .button-danger:hover { border-color: var(--danger); color: #f1bbb1; }
    .button[disabled] { opacity: .45; cursor: wait; transform: none; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line); border-radius: .55rem; overflow: hidden; background: rgba(23,26,21,.75); }
    .metric { min-height: 7.4rem; padding: 1.2rem 1.35rem; border-right: 1px solid var(--line); display: flex; flex-direction: column; justify-content: space-between; }
    .metric:last-child { border-right: 0; }
    .metric-value { font: 500 2.15rem/1 var(--mono); letter-spacing: -.07em; font-variant-numeric: tabular-nums; }
    .metric-note { color: var(--faint); font-size: .78rem; }
    .workspace { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(19rem, .72fr); gap: 1.1rem; margin-top: 1.1rem; align-items: start; }
    .stack { display: grid; gap: 1.1rem; }
    .panel { border: 1px solid var(--line); background: rgba(23,26,21,.88); border-radius: .55rem; overflow: hidden; }
    .panel-head { min-height: 3.5rem; padding: .9rem 1.15rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-bottom: 1px solid var(--line); }
    .panel-title { margin: 0; font-size: .88rem; font-weight: 600; letter-spacing: -.01em; }
    .panel-meta { color: var(--muted); font: .7rem/1 var(--mono); }
    .panel-body { padding: 1.15rem; }
    .active-card { position: relative; min-height: 15rem; padding: 1.55rem; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(125deg, rgba(185,211,155,.11), transparent 55%); }
    .active-card::after { content: ""; position: absolute; right: 1.5rem; top: 1.5rem; width: 5rem; height: 5rem; border: 1px solid rgba(185,211,155,.22); border-radius: 50% 44% 52% 46%; transform: rotate(18deg); }
    .active-title { max-width: 20ch; margin: .65rem 0 .45rem; font: 500 clamp(1.8rem, 3vw, 3rem)/1 var(--display); letter-spacing: -.035em; text-wrap: balance; }
    .active-id { color: var(--muted); font: .72rem/1.4 var(--mono); }
    .context-strip { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1.4rem; }
    .context-chip { padding: .45rem .6rem; border-left: 2px solid var(--accent); background: rgba(255,255,255,.035); font-size: .76rem; }
    .empty-state { min-height: 15rem; padding: 2rem; display: grid; align-content: center; justify-items: start; }
    .empty-state h3 { margin: .65rem 0 .5rem; font: 500 2rem/1 var(--display); letter-spacing: -.03em; }
    .empty-state p { max-width: 34rem; margin: 0 0 1.3rem; color: var(--muted); }
    .link-list { display: grid; }
    .semantic-link { display: grid; grid-template-columns: minmax(0,1fr) 8.5rem minmax(0,1fr); align-items: center; gap: .75rem; padding: 1rem 1.15rem; border-bottom: 1px solid var(--line); }
    .semantic-link:last-child { border-bottom: 0; }
    .node { min-width: 0; }
    .node-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .84rem; font-weight: 600; }
    .node-type { margin-top: .2rem; color: var(--faint); font: .66rem/1 var(--mono); }
    .edge { position: relative; text-align: center; color: var(--accent); font: .66rem/1 var(--mono); }
    .edge::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid var(--line-bright); }
    .edge span { position: relative; padding: 0 .45rem; background: var(--surface); }
    .edge::after { content: "›"; position: absolute; right: -.1rem; top: -.5rem; color: var(--line-bright); font-size: 1rem; }
    .queue { display: grid; gap: .7rem; }
    .candidate { padding: 1rem; background: #1d211b; border-left: 2px solid var(--warning); border-radius: .2rem .45rem .45rem .2rem; }
    .candidate-route { margin: .5rem 0 .75rem; font-size: .87rem; line-height: 1.35; }
    .candidate-route strong { font-weight: 600; }
    .confidence { color: var(--warning); font: .7rem/1 var(--mono); font-variant-numeric: tabular-nums; }
    .evidence { margin: 0; padding: .65rem .75rem; color: #b7bcb1; background: rgba(0,0,0,.15); font-size: .75rem; border-radius: .25rem; }
    .candidate-actions { display: flex; gap: .5rem; margin-top: .8rem; }
    .candidate-actions .button { min-height: 2rem; padding: .36rem .68rem; font-size: .74rem; }
    .activity-list { list-style: none; padding: 0; margin: 0; }
    .activity-item { position: relative; padding: .15rem 0 1.05rem 1.15rem; color: #b7bcb1; font-size: .76rem; }
    .activity-item::before { content: ""; position: absolute; left: 0; top: .38rem; width: .38rem; height: .38rem; border-radius: 50%; background: var(--line-bright); }
    .activity-item::after { content: ""; position: absolute; left: .17rem; top: .9rem; bottom: 0; border-left: 1px solid var(--line); }
    .activity-item:last-child::after { display: none; }
    .activity-time { display: block; margin-top: .18rem; color: var(--faint); font: .63rem/1 var(--mono); }
    .entity-table { width: 100%; border-collapse: collapse; }
    .entity-table th, .entity-table td { padding: .78rem 1.15rem; text-align: left; border-bottom: 1px solid var(--line); }
    .entity-table th { color: var(--muted); font: 600 .62rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
    .entity-table td { font-size: .78rem; }
    .entity-table tr:last-child td { border-bottom: 0; }
    .entity-table tbody tr { transition: background 180ms ease; }
    .entity-table tbody tr:hover { background: rgba(255,255,255,.025); }
    .entity-type { color: var(--accent); font: .66rem/1 var(--mono); }
    .activate { color: var(--muted); border: 0; background: transparent; cursor: pointer; text-decoration: underline; text-underline-offset: .2rem; }
    .activate:hover { color: var(--ink); }
    .blank { padding: 1.2rem; color: var(--muted); font-size: .8rem; }
    .skeleton { min-height: 10rem; background: linear-gradient(90deg, transparent, rgba(255,255,255,.035), transparent); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    .toast { position: fixed; right: 1.25rem; bottom: 1.25rem; z-index: 2; max-width: 24rem; padding: .8rem 1rem; border: 1px solid var(--line-bright); border-radius: .4rem; background: #262b23; color: var(--ink); box-shadow: 0 1rem 3rem rgba(5,8,4,.4); transform: translateY(1rem); opacity: 0; pointer-events: none; transition: transform 220ms ease, opacity 220ms ease; }
    .toast.visible { transform: translateY(0); opacity: 1; }
    .toast.error { border-color: var(--danger); }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (max-width: 900px) {
      .masthead, .workspace { grid-template-columns: 1fr; gap: 1.5rem; }
      .metrics { grid-template-columns: 1fr 1fr; }
      .metric:nth-child(2) { border-right: 0; }
      .metric:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
    }
    @media (max-width: 620px) {
      .shell { width: min(100% - 1.25rem, 1360px); }
      .masthead { padding-top: 2.8rem; }
      h1 { font-size: clamp(2.8rem, 16vw, 4.4rem); }
      .metrics { grid-template-columns: 1fr; }
      .metric { min-height: 5.7rem; border-right: 0; border-bottom: 1px solid var(--line); }
      .metric:last-child { border-bottom: 0; }
      .semantic-link { grid-template-columns: 1fr; }
      .edge { text-align: left; }
      .edge::before, .edge::after { display: none; }
      .edge span { padding: 0; }
      .entity-table th:nth-child(3), .entity-table td:nth-child(3) { display: none; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <a class="skip" href="#workspace">Skip to workspace</a>
  <div class="shell">
    <nav class="topbar" aria-label="Product navigation">
      <div class="brand"><span class="mark" aria-hidden="true">L</span><span>Logos</span></div>
      <div class="status"><span class="status-dot" aria-hidden="true"></span><span>local event store connected</span></div>
    </nav>
    <header class="masthead">
      <div><div class="kicker">Semantic context layer</div><h1>See the work behind the work.</h1></div>
      <div class="masthead-copy">
        <p>Logos keeps tasks, branches, pull requests, evidence, and agent context attached to the same underlying work.</p>
        <div class="toolbar">
          <button class="button button-primary" data-action="demo">Load sample workspace</button>
          <button class="button button-quiet" data-action="resolve">Run resolver</button>
        </div>
      </div>
    </header>
    <main id="workspace">
      <section class="metrics" aria-label="Workspace metrics" id="metrics">
        <div class="metric skeleton"></div><div class="metric skeleton"></div><div class="metric skeleton"></div><div class="metric skeleton"></div>
      </section>
      <div class="workspace">
        <div class="stack">
          <section class="panel" aria-labelledby="active-title">
            <div class="panel-head"><h2 class="panel-title" id="active-title">Active context</h2><span class="panel-meta" id="context-time">—</span></div>
            <div id="active"><div class="skeleton"></div></div>
          </section>
          <section class="panel" aria-labelledby="links-title">
            <div class="panel-head"><h2 class="panel-title" id="links-title">Semantic links</h2><span class="panel-meta" id="link-count">—</span></div>
            <div class="link-list" id="links"><div class="skeleton"></div></div>
          </section>
          <section class="panel" aria-labelledby="entities-title">
            <div class="panel-head"><h2 class="panel-title" id="entities-title">Known entities</h2><span class="panel-meta">select a work item to focus</span></div>
            <div id="entities"><div class="skeleton"></div></div>
          </section>
        </div>
        <aside class="stack" aria-label="Review and activity">
          <section class="panel" aria-labelledby="queue-title">
            <div class="panel-head"><h2 class="panel-title" id="queue-title">Review queue</h2><span class="panel-meta" id="queue-count">—</span></div>
            <div class="panel-body queue" id="queue"><div class="skeleton"></div></div>
          </section>
          <section class="panel" aria-labelledby="activity-title">
            <div class="panel-head"><h2 class="panel-title" id="activity-title">Semantic activity</h2><span class="panel-meta">append-only</span></div>
            <div class="panel-body"><ol class="activity-list" id="activity"><li class="skeleton"></li></ol></div>
          </section>
        </aside>
      </div>
    </main>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script>
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const typeLabel = value => String(value).replace(/([a-z])([A-Z])/g, '$1 $2');
    const timeLabel = value => value ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : 'not set';
    const toast = (message, error = false) => {
      const node = document.querySelector('#toast');
      node.textContent = message; node.className = 'toast visible' + (error ? ' error' : '');
      clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => node.className = 'toast', 2600);
    };
    async function api(path, options) {
      const response = await fetch(path, options);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      return payload;
    }
    function renderMetrics(metrics) {
      const values = [
        ['Entities', metrics.entities, 'stable semantic identities'],
        ['Components', metrics.components, 'external representations'],
        ['Canonical links', metrics.relations, 'grounded with evidence'],
        ['Review queue', metrics.candidates, 'uncertain, never auto-merged']
      ];
      document.querySelector('#metrics').innerHTML = values.map(item => '<div class="metric"><span class="label">' + item[0] + '</span><strong class="metric-value">' + item[1] + '</strong><span class="metric-note">' + item[2] + '</span></div>').join('');
    }
    function renderActive(overview) {
      const context = overview.activeContext;
      const work = context.entities.find(entity => entity.id === context.active.workItemId);
      document.querySelector('#context-time').textContent = timeLabel(context.active.updatedAt);
      if (!work) {
        document.querySelector('#active').innerHTML = '<div class="empty-state"><div class="label">Nothing selected</div><h3>Start with one piece of work.</h3><p>Load the sample workspace or activate a WorkItem below. Related branches, decisions, and evidence will appear here.</p><button class="button button-primary" data-action="demo">Load sample workspace</button></div>';
        return;
      }
      const related = context.entities.filter(entity => entity.id !== work.id);
      document.querySelector('#active').innerHTML = '<article class="active-card"><div><div class="label">' + escapeHtml(work.type) + ' · active now</div><h3 class="active-title">' + escapeHtml(work.title) + '</h3><div class="active-id">' + escapeHtml(work.id) + '</div></div><div class="context-strip">' + related.map(entity => '<span class="context-chip">' + escapeHtml(entity.type) + ' / ' + escapeHtml(entity.title) + '</span>').join('') + '</div></article>';
    }
    function renderLinks(overview) {
      document.querySelector('#link-count').textContent = overview.links.length + ' canonical';
      document.querySelector('#links').innerHTML = overview.links.length ? overview.links.map(link => '<article class="semantic-link"><div class="node"><div class="node-name">' + escapeHtml(link.from.title) + '</div><div class="node-type">' + escapeHtml(link.from.type) + '</div></div><div class="edge"><span>' + escapeHtml(link.type) + '</span></div><div class="node"><div class="node-name">' + escapeHtml(link.to.title) + '</div><div class="node-type">' + escapeHtml(link.to.type) + ' · ' + link.evidence.length + ' evidence</div></div></article>').join('') : '<div class="blank">No canonical links yet. Import connector data or create a grounded branch.</div>';
    }
    function renderQueue(overview) {
      document.querySelector('#queue-count').textContent = overview.hypotheses.length + ' candidates';
      document.querySelector('#queue').innerHTML = overview.hypotheses.length ? overview.hypotheses.map(item => '<article class="candidate"><div class="confidence">' + Math.round(item.confidence * 100) + '% · ' + escapeHtml(item.relationType) + '</div><div class="candidate-route"><strong>' + escapeHtml(item.from.title) + '</strong><br>may ' + escapeHtml(item.relationType) + '<br><strong>' + escapeHtml(item.to.title) + '</strong></div><p class="evidence">' + escapeHtml(item.evidence[0]?.description || 'No evidence description') + '</p><div class="candidate-actions"><button class="button button-primary" data-review="accept" data-id="' + escapeHtml(item.id) + '">Accept</button><button class="button button-danger" data-review="reject" data-id="' + escapeHtml(item.id) + '">Reject</button></div></article>').join('') : '<div class="blank">Nothing needs a decision. Canonical facts remain separate from rejected or unresolved claims.</div>';
    }
    function renderActivity(activity) {
      document.querySelector('#activity').innerHTML = activity.length ? activity.map(event => '<li class="activity-item">' + escapeHtml(typeLabel(event.type)) + '<span class="activity-time">' + timeLabel(event.at) + '</span></li>').join('') : '<li class="blank">No semantic events recorded.</li>';
    }
    function renderEntities(overview) {
      document.querySelector('#entities').innerHTML = overview.entities.length ? '<table class="entity-table"><thead><tr><th>Entity</th><th>Type</th><th>Representations</th><th>Context</th></tr></thead><tbody>' + overview.entities.map(entity => '<tr><td>' + escapeHtml(entity.title) + '</td><td><span class="entity-type">' + escapeHtml(entity.type) + '</span></td><td>' + entity.componentCount + '</td><td>' + (entity.type === 'WorkItem' ? '<button class="activate" data-work="' + escapeHtml(entity.id) + '">Activate</button>' : '—') + '</td></tr>').join('') + '</tbody></table>' : '<div class="blank">This workspace has no entities yet.</div>';
    }
    async function load() {
      try {
        const overview = await api('/api/overview');
        renderMetrics(overview.metrics); renderActive(overview); renderLinks(overview); renderQueue(overview); renderActivity(overview.activity); renderEntities(overview);
      } catch (error) { toast(error.message, true); }
    }
    async function mutate(button, action, success) {
      if (button) button.disabled = true;
      try { await action(); toast(success); await load(); } catch (error) { toast(error.message, true); } finally { if (button) button.disabled = false; }
    }
    document.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      if (button.dataset.action === 'demo') mutate(button, () => api('/api/demo', {method:'POST'}), 'Sample workspace loaded');
      if (button.dataset.action === 'resolve') mutate(button, () => api('/api/resolve', {method:'POST'}), 'Resolver finished');
      if (button.dataset.review) mutate(button, () => api('/api/hypotheses/' + button.dataset.id + '/' + button.dataset.review, {method:'POST'}), 'Review decision recorded');
      if (button.dataset.work) mutate(button, () => api('/api/context/work/' + button.dataset.work, {method:'POST'}), 'Active context changed');
    });
    load();
  </script>
</body>
</html>`;
