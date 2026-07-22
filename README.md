# Logos

Logos is a local-first semantic context layer for software projects. It connects the same work as it appears in Linear, GitHub, local Git, and coding-agent sessions without silently merging uncertain identities.

This repository contains an MVP focused on one workflow: import a task, connect branches and pull requests with inspectable evidence, start work, and deliver bounded context to a human or coding agent.

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer

```bash
bun install
bun test
bun run typecheck
```

All workspace data is local and append-only at `.logos/events.jsonl`. Delete or export that file using normal filesystem tooling; Logos does not send connector data to an external service.

## Five-minute walkthrough

Run the commands from a project whose context you want Logos to maintain:

```bash
bun run /path/to/logos/src/cli.ts init
bun run /path/to/logos/src/cli.ts import linear /path/to/logos/examples/linear.json
bun run /path/to/logos/src/cli.ts import github /path/to/logos/examples/github.json
bun run /path/to/logos/src/cli.ts resolve
bun run /path/to/logos/src/cli.ts hypothesis list --status candidate
bun run /path/to/logos/src/cli.ts work start ENG-142
bun run /path/to/logos/src/cli.ts agent context
```

`resolve` creates reviewable hypotheses, not canonical facts. Inspect one with `explain <hypothesis-id>`, then use `hypothesis accept <id>` or `hypothesis reject <id>`.

For the local review UI:

```bash
bun run /path/to/logos/src/cli.ts serve --port 4317
```

Open `http://localhost:4317`. The API behind it exposes:

- `GET /api/entities`
- `GET /api/relations`
- `GET /api/hypotheses?status=candidate`
- `GET /api/context`
- `POST /api/hypotheses/:id/accept`
- `POST /api/hypotheses/:id/reject`

## Grounded Git workflow

Start a work item before creating a branch:

```bash
bun run /path/to/logos/src/cli.ts work start ENG-142
bun run /path/to/logos/src/cli.ts branch create feature/ENG-142-cache-policy
```

`branch create` runs `git switch -c`, creates the Branch entity, records an `implements` relation with operation evidence, and updates Active Context. Use `branch register <name>` when the Git branch already exists.

## Connector export format

The MVP accepts read-only JSON exports so it can be evaluated without granting tokens or write access. Imports are idempotent by `(provider, externalId)`.

Linear:

```json
{
  "projects": [{ "id": "project-1", "key": "ENG", "name": "Engineering" }],
  "issues": [{ "id": "issue-1", "identifier": "ENG-142", "title": "Cache policy", "projectId": "project-1" }]
}
```

GitHub:

```json
{
  "repositories": [{ "id": "repo-1", "name": "acme/api", "url": "https://github.com/acme/api" }],
  "branches": [{ "id": "branch-1", "name": "feature/ENG-142-cache", "repositoryId": "repo-1" }],
  "pullRequests": [{ "id": "pr-8", "number": 8, "title": "Cache policy", "body": "Implements ENG-142", "repositoryId": "repo-1", "branchId": "branch-1" }]
}
```

Supported GitHub arrays are `repositories`, `issues`, `branches`, `commits`, and `pullRequests`. Re-importing the same external identity refreshes its Component data while preserving event history. An imported record may include `logosEntityId` when its identity was propagated at write time; Logos then adds the representation to that entity instead of creating a new one.

## Coding-agent integration

Start the MCP-compatible stdio server with:

```bash
bun run /path/to/logos/src/cli.ts mcp
```

Example MCP server configuration for Claude Code or another JSON-configured client:

```json
{
  "mcpServers": {
    "logos": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/logos/src/cli.ts", "mcp"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

For Codex, use the same command, arguments, and project working directory in its MCP server configuration. The server exposes exactly three tools:

- `logos_context_get` — read the bounded active context and audit its delivery. Pass `operation: "review-hypotheses"` to select the unresolved review queue; other operations use the active one-hop work policy.
- `logos_explain` — inspect provenance for a relation or hypothesis.
- `logos_relation_propose` — create a hypothesis only; it cannot create a canonical relation.

Canonical mutation remains in the human CLI/Review UI boundary.

## Semantic safety guarantees

- Every canonical relation requires Evidence.
- Hypotheses remain separate from canonical relations until accepted.
- Duplicate external identity raises a conflict rather than triggering a merge.
- Merge and merge reversal are explicit semantic events.
- Imports and resolver decisions retain their source and resolver version.
- Agent context includes current external Component state, is selected by operation, and every delivery is logged.

See [CONCEPT.md](CONCEPT.md), [ROADMAP.md](ROADMAP.md), and [docs/MVP.md](docs/MVP.md) for product scope and the implementation map.
