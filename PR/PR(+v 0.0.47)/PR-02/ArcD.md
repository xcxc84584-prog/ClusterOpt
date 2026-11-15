# v0.0.47 PR-02 — Render Coordinator

## PRDrequest
Add isolated frame-coalescing coordinator. Keep production rendering unchanged in this PR; wire it to editor events in PR-03 after tests. Update all visible version labels and root redirect to 0.0.47.

## ArcD
Object: Render_Coordinator. Public Request: Schedule({source,revision,render}), Cancel(), Dispose(), Get_Status. Private Properties: Pending_Frame, Generation_ID, Pending_Task. Response: 202 scheduled, 400 invalid, 410 disposed, 500 scheduler failure. EHU: onError callback for execution failures; no user content logged.

## Event Chain
Request.Schedule -> validate -> generation increment -> frame queue -> capture immutable snapshot -> callback -> EHU on failure. Multiple requests before a frame: only latest executes. Cancel/Dispose invalidates generation. No editor or storage mutation.

## Plan
Reference: MDN requestAnimationFrame https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame ; cancellation https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame . Technical reference, not claimed independently verified in this PR. Limitations: callback is responsible for checking snapshot.isCurrent() before committing async output. Browser integration deferred.

## Relation Test
CI-discoverable tests: Program/tests/render-coordinator.test.mjs (coalescing, stale generation, cancel/dispose, error).
GitHub Actions: pending at initial commit.
VTE isolated tests: same deterministic injected scheduler; no production editor involved.
Browser DOM alignment: NOT RUN (not part of this PR).
QuestionList and registries: no runtime dependency change; integration tracked in follow-up PR.
