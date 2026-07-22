# MVP scope and roadmap mapping

The MVP deliberately proves the semantic identity workflow locally before adding hosted connectors, authentication, or autonomous cross-tool writes.

| Roadmap capability | MVP implementation | Verification |
| --- | --- | --- |
| Entity and Component storage | Typed entities and external representations rebuilt from `.logos/events.jsonl` | Kernel public tests |
| Typed Relation and Evidence | Canonical relations reject empty or unknown evidence | Kernel public tests |
| Hypothesis overlay | Candidate, accept, and reject lifecycle is separate from facts | Kernel and CLI tests |
| Context stack | Project, WorkItem, Repository, and Branch Active Context | CLI workflow tests |
| Append-only history | Every semantic mutation and context delivery is a JSONL event | Reload and MCP tests |
| Identity safety | External identity collision errors; explicit reversible merge events | Kernel public tests |
| Linear/GitHub read ingestion | Idempotent local JSON connector exports | CLI workflow tests |
| Deterministic resolver | Explicit Linear identifiers in branches, commits, and PRs produce hypotheses with versioned evidence | CLI workflow tests |
| Write-time grounding | Active WorkItem → local Git Branch → canonical `implements` relation | Interface tests |
| Evidence review | CLI explanation plus local HTTP review queue | Interface tests |
| Agent context API | MCP stdio server with bounded Read/Explain/Propose tools | Interface tests |
| Permission separation | MCP can read/propose; human CLI/UI accepts or rejects | Interface tests |
| Session log | Every delivered agent context records consumer, operation, and entity IDs | MCP test |

## Explicit MVP deferrals

- Live OAuth and hosted GitHub/Linear connector polling
- GitHub pull-request creation and Linear mutation
- LLM/embedding resolver layers
- Team namespaces, authentication, billing, and hosted reliability
- Automatic identity merge from weak evidence

These are later Roadmap phases. Adding them before teams validate the local workflow would increase integration and identity risk without improving the MVP's central test.

## Acceptance workflow

1. Import `examples/linear.json` and `examples/github.json`.
2. Run deterministic resolution and inspect the proposed links and Evidence.
3. Accept or reject proposals in CLI or the Review UI.
4. Start `ENG-142` and register or create a branch.
5. Fetch Agent Context over CLI, HTTP, or MCP.
6. Inspect `.logos/events.jsonl` to confirm the history and context-delivery audit.
