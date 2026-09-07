# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the original semantic-context MVP: `kernel.ts`, `event-store.ts`, connectors, CLI, HTTP, and MCP interfaces.
- `src/workspace/` contains the isolated functional workspace prototype. Its component registry, SQLite store, commands, projections, HTTP server, and UI live here.
- `src/workspace/components/` contains feature definitions and validators; `src/workspace/projections/` contains read-only derived views.
- `test/` contains Bun tests for the MVP and workspace prototype. `examples/` contains connector import fixtures. Durable design records live in `docs/`.
- Workspace prototype data belongs in `.logos-workspace/`; do not use or migrate the MVP data in `.logos/events.jsonl`.

## Build, Test, and Development Commands

```bash
bun install                 # Install the locked dependencies
bun run typecheck           # Run TypeScript without emitting files
bun test                    # Run the complete Bun test suite
bun run workspace serve --port 4318  # Start the functional workspace UI
bun run src/cli.ts serve --port 4317 # Start the semantic-context dashboard
```

Use a temporary workspace when manually exercising persistence. Do not commit `.logos-workspace/` or generated databases.

## Coding Style & Naming Conventions

Use TypeScript with strict compiler settings, two-space indentation, semicolons, and double-quoted module strings. Prefer explicit interfaces and discriminated unions for persisted data. Use `camelCase` for variables and methods, `PascalCase` for types and classes, and kebab-style descriptive commit subjects. Keep UI updates behind shared commands; never write SQLite tables directly from UI code.

## Testing Guidelines

Tests use `bun:test` and are named `*.public.test.ts`. Add boundary tests for validation, revision conflicts, operation replay, restart recovery, unknown components, and atomic state/event updates. Run the full suite with `bun test`; no separate coverage threshold is currently configured.

## Commit & Pull Request Guidelines

Git history uses short imperative subjects such as `feat:`, `fix:`, `refactor:`, and `docs:`. Keep commits focused on a verified unit; preserve meaningful units with Jujutsu using `jj describe -m "..."` followed by `jj new`. Pull requests should describe behavior changes, test commands and results, storage or migration impact, and UI changes with screenshots when applicable. Do not silently alter the legacy MVP interfaces or data format.

## Architecture and Data Safety

The workspace dependency direction is UI/HTTP → shared commands and queries → registered component definitions and validation → SQLite persistence. Current state and append-only events must be committed in one transaction. Component removal is logical, IDs are never reused, and unknown component types must be retained and shown read-only.
