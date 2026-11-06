---
name: orchestrator-rich
description: Rich (max-quality) mode of the spec → executors → PR review build loop. Fable 5.1 orchestrates and reviews; Opus 5.5 (medium) executors each implement one deliverable on their own branch and open a PR. Use when the user asks for "rich mode", the premium or high-quality orchestrator, the Fable orchestrator, or the Fable + Opus workflow.
---

# Orchestrator workflow: rich mode

Read `.claude/orchestrator/WORKFLOW.md` (repo root) and follow it with this mode config:

| Setting | Value |
|---|---|
| `ORCH_MODEL` | `claude-fable-5-1` (Fable 5.1, this session) |
| `EXEC_MODEL` | `opus` (Opus 5.5) |
| `EXEC_EFFORT` | `medium` |

## Mode rules (override the shared defaults)
- **Spec the intent, not every pixel.** Opus executors can fill in sensible details. Still fix the interfaces, file ownership, copy text and acceptance criteria. Leave internal implementation choices to the executor, and ask it to justify any that matter in the PR body.
- **One deliverable per executor.** Don't batch. Smaller scopes give cleaner PRs and reviews.
- **Full per-PR review.** Read every PR diff in full as it arrives, not only the integrated diff.
- **Independent second review.** Before the final merge of each phase, start one fresh `Agent` (`model: "opus"`, `effort: "medium"`, no worktree) to review the integrated diff for bugs and security issues. Give it the diff and the brief, not your conclusions. Check its findings yourself before acting on them.
- **Thorough verification.** The trial integration covers every acceptance criterion, plus reduced motion, a 390 px mobile width and keyboard navigation where relevant. Screenshots the user will see use `deviceScaleFactor: 2`.
