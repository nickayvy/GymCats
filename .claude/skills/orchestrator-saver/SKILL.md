---
name: orchestrator-saver
description: Money-saving mode of the spec → executors → PR review build loop. Opus 5.5 (medium) orchestrates and reviews; Haiku 5.5 (high) executors each implement one deliverable on their own branch and open a PR. Use when the user asks for "money saving mode", "saver mode", the cheap or budget orchestrator, or the Opus + Haiku workflow.
---

# Orchestrator workflow: money-saving mode

Read `.claude/orchestrator/WORKFLOW.md` (repo root) and follow it with this mode config:

| Setting | Value |
|---|---|
| `ORCH_MODEL` | `claude-opus-5-5` on **medium** effort (this session) |
| `EXEC_MODEL` | `haiku` (Haiku 5.5) |
| `EXEC_EFFORT` | `high` |

## Mode rules (override the shared defaults)
- **Spec literally.** Haiku follows instructions well but guesses badly. Give exact copy, class strings, signatures and error messages for every deliverable, and name any API details (with versions) it needs.
- **Batch small work.** If several deliverables are each under ~40 lines and sit in the same area, give them to one executor (still with disjoint files from the others). Aim for the fewest executors that still keep each one focused.
- **Lean reviews.** For trivial PRs (docs, constants, styles), review the trial-integration diff instead of reading each PR diff on its own.
- **One integration pass.** Wait until every executor in a phase has reported, then do a single trial integration and browser run for that phase rather than one per PR.
- **Cheap verification.** Screenshots only you look at use `deviceScaleFactor: 1`. Check the acceptance criteria only; no exploratory testing.
- **Stop for the user** only for a design decision or a blocker. Don't stop for confirmations the brief already covers.
