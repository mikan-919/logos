// Logos CLI — REST API を叩いて Logos を操作する。
// 使い方:
//   bun run src/cli/logos.ts list [Type]
//   bun run src/cli/logos.ts show <entityId>
//   bun run src/cli/logos.ts merge <a> <b>
//   bun run src/cli/logos.ts set <entityId> <type> <field> <value>
//   bun run src/cli/logos.ts mock-edit <service> <externalId> <field> <value>
//   bun run src/cli/logos.ts conflicts
//   bun run src/cli/logos.ts resolve <entityId> <winnerType>
//   bun run src/cli/logos.ts log [n]

export {};

const BASE = process.env.LOGOS_API ?? "http://localhost:3000/api";

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    console.error(`! ${res.status}`, data);
    process.exit(1);
  }
  return data;
}

function printEntity(e: any) {
  const flag = e.status === "conflict" ? "  ⚠ CONFLICT" : "";
  console.log(`\n● ${e.id}${flag}`);
  for (const c of e.components) {
    const title = c.fields.title !== undefined ? `"${c.fields.title}"` : "";
    console.log(`    ${c.type.padEnd(12)} ${title}  ${JSON.stringify(c.fields)}`);
  }
}

function printLog(lines: any[]) {
  const icon: Record<string, string> = {
    event: "→", reconcile: "✓", noop: "·", conflict: "⚠", info: "i",
  };
  for (const l of lines) console.log(`  ${icon[l.level] ?? " "} [${l.level}] ${l.message}`);
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "list": {
    const has = args[0] ? `?has=${args[0]}` : "";
    const ents = await api("GET", `/entities${has}`);
    if (!ents.length) console.log("(no entities)");
    ents.forEach(printEntity);
    break;
  }
  case "show": {
    printEntity(await api("GET", `/entities/${args[0]}`));
    break;
  }
  case "merge": {
    const e = await api("POST", "/merge", { a: args[0], b: args[1] });
    console.log("merged:");
    printEntity(e);
    console.log("\n--- log ---");
    printLog(await api("GET", "/log?n=10"));
    break;
  }
  case "set": {
    const [id, type, field, value] = args;
    await api("PATCH", `/components/${id}/${type}`, { [field!]: value });
    console.log("--- log ---");
    printLog(await api("GET", "/log?n=10"));
    printEntity(await api("GET", `/entities/${id}`));
    break;
  }
  case "mock-edit": {
    const [service, externalId, field, value] = args;
    await api("POST", "/mock/edit", { service, externalId, fields: { [field!]: value } });
    console.log("--- log ---");
    printLog(await api("GET", "/log?n=12"));
    break;
  }
  case "conflicts": {
    const cs = await api("GET", "/conflicts");
    if (!cs.length) { console.log("(no conflicts)"); break; }
    for (const c of cs) {
      console.log(`⚠ ${c.entityId}`);
      for (const s of c.sides) console.log(`    ${s.type} = "${s.title}"`);
    }
    break;
  }
  case "resolve": {
    await api("POST", `/conflicts/${args[0]}/resolve`, { winnerType: args[1] });
    console.log("resolved.");
    printEntity(await api("GET", `/entities/${args[0]}`));
    break;
  }
  case "log": {
    printLog(await api("GET", `/log?n=${args[0] ?? 30}`));
    break;
  }
  default:
    console.log("commands: list, show, merge, set, mock-edit, conflicts, resolve, log");
}
