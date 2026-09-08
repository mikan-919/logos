#!/usr/bin/env bun
import { startWorkspaceHttpServer } from "./http";
import { startWorkspaceMcpServer } from "./mcp";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const args = process.argv.slice(2);
if (args[0] === "mcp") {
  await startWorkspaceMcpServer(process.cwd());
  process.exit(0);
}
if (args[0] !== "serve") {
  console.log("Usage: bun run workspace <serve [--port 4318]|mcp>");
  process.exit(0);
}

const port = Number(option(args, "--port") ?? "4318");
const server = startWorkspaceHttpServer(process.cwd(), port);
console.log(`Logos workspace: ${server.url}`);
await new Promise(() => {});
