# Orchestrator → executor workflow (shared)

Used by the `orchestrator-saver` and `orchestrator-rich` skills. Each skill sets the **mode config**:

- `ORCH_MODEL`: the model this session must run as orchestrator.
- `EXEC_MODEL` / `EXEC_EFFORT`: what each executor subagent runs.
- **Mode rules**: cost or depth adjustments that override the defaults below.

| Role | Responsibility |
|---|---|
| Orchestrator (this session) | Problem statement, brief, acceptance criteria, amendments, PR review, integration testing, merges |
| Executor (`Agent` subagent) | Implement **one** deliverable exactly as specced, on its own branch, then open a PR |

## 0. Check the orchestrator model
Call `get_session` (claude-code-remote) and read `session_context.model`. If it isn't `ORCH_MODEL`, tell the user to switch with `/model` (or the app's model picker) before continuing. The orchestrator can't switch its own model. If the user says to go ahead anyway, continue and note the mismatch in the final report.

## 1. Problem statement
Distil the request into 1–3 sentences: what, why, constraints. Ask the user only about decisions that change the design (data storage, scope, UX choices). Use sensible defaults for everything else.

## 2. Write the brief (orchestrator)
Write it to the scratchpad as `<feature>-brief.md`. It must contain:
- **Stack facts.** Check installed versions in `node_modules/*/package.json`, never `package.json` ranges or memory. Check library APIs in `node_modules` docs and types before speccing them.
- **Architecture and data flow** (a small diagram).
- **Deliverables.** Each one is IDed (e.g. `S1`) and lists the **exact files** it may touch. File sets must never overlap between deliverables. Give exact signatures, types, copy text and class strings, so executors don't invent them. The weaker the executor model, the more literal the spec.
- **Implementation order.** Group into phases by dependency. Anything other deliverables import goes in Phase 1.
- **Acceptance criteria**, each checkable (commands, browser checks, or code review).

Before starting executors, re-read the brief against the codebase. Fix anything an executor would have to guess.

**Fix shared infrastructure yourself.** Dependency upgrades, a typing bug in a shared client, and installing packages are done by the orchestrator, committed straight to the integration branch. Never let each executor work around one locally with casts.

## 3. Executors
Write `executor-protocol.md` in the scratchpad (template below), then start one `Agent` per deliverable, independent ones in parallel in a single message:

```
Agent({ description: "Executor S1: …", subagent_type: "general-purpose",
        model: EXEC_MODEL, effort: EXEC_EFFORT, isolation: "worktree", run_in_background: true,
        prompt: "Follow the executor protocol at <path> exactly. Your deliverable: S1 — <title>. YOUR_BRANCH = <integration-branch>-s1-<slug>, ID = S1. <any per-deliverable notes>" })
```

Keep prompts short: the brief and protocol carry the detail. Say which sibling modules won't exist in their worktree, and that unresolved imports of exactly those are expected.

### Executor protocol template
1. In your isolated worktree: `git fetch origin <integration-branch> && git checkout -b <YOUR_BRANCH> origin/<integration-branch>`. Then run `ln -s <main-checkout>/node_modules node_modules`. Never `npm install`.
2. Touch only your deliverable's files. Add no extra features. If the spec is ambiguous or impossible, stop and report it rather than guess.
3. Verify with `npx tsc --noEmit` (only errors in your files matter) and `npx eslint <your files>`.
4. Commit with the session's attribution trailers (the executor's own model in `Co-Authored-By`), then `git push -u origin <YOUR_BRANCH>`. Use plain commands: compound retry loops get refused.
5. Open a PR with `mcp__github__create_pull_request` (load it via ToolSearch), base = the integration branch, title `[<ID>] …`. The body maps the work to the spec and includes verification output and concerns.
6. Report: branch, PR URL, files, verification, concerns.

## 4. Review and integrate (orchestrator)
- Review each PR diff (`pull_request_read` `get_diff`) against the brief as it arrives.
- **Merge leaf PRs right away.** Hold PRs whose imports aren't merged yet.
- Before merging dependent PRs, do a **trial integration**. Create a scratch worktree of the integration branch, merge every executor branch into it, and run typecheck, lint and build. Then drive the real flows with Playwright (headless Chromium is preinstalled), covering every acceptance criterion.
- **Changes needed?** Append `## Amendment A<n>` to the brief, then `SendMessage` the same executor (it keeps its context) with the amendment and exact steps. Executors rebase and push to the same PR.
- **User changes scope mid-run?** Amend the brief and message every affected executor at once. If an executor finishes before it reads the message, message it again.
- **Approve as a COMMENT review.** GitHub blocks approving your own account's PRs. The comment says what was verified, plus any non-blocking follow-ups, and ends with the attribution footer. Then squash-merge in dependency order.
- When everything is merged, re-run the checks and the browser flow on the integration branch, and open or update the integration PR to `main`.

## 5. Report to the user
Say which mode ran. Say what shipped and how it was verified. Name anything that couldn't be verified here (live services, network-blocked hosts). List follow-ups and what the user has to do (dashboard settings, keys). Then ask what's next.

## Rules
- The approved brief is the source of truth. Scope changes go through an amendment before executors act on them.
- One deliverable per executor, with disjoint files, so no two agents edit the same file.
- Never report completion without the orchestrator's own review and integration test.
- Never paste secrets into briefs, prompts or commits. Credentials go through `request_credential` or a connector.
- Clean up scratch worktrees afterwards. The proxy blocks deleting remote branches, so tell the user which merged branches to delete.
