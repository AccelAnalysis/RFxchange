# Post-Wave 3 Stabilization 2C — same-SHA App Hosting proof

**Scope:** release engineering only
**Backend:** `projects/rfxchange/locations/us-east4/backends/rfxchange`
**Production origin:** `https://rfxchange--rfxchange.us-east4.hosted.app`
**Automatic rollouts:** remain paused

## Why the earlier blocker can now be closed

The original 2C stop was correct at the time: RFxchange had no documented immutable source-commit value inside the managed App Hosting build that could safely be treated as `RFXCHANGE_BUILD_SHA`.

Firebase App Hosting now documents two release-engineering facts that provide a reviewable same-SHA proof without inventing an environment variable:

1. `Build.source.codebase.hash` is an output-only **full SHA-1 Git commit hash** for the resolved source commit; and
2. `Build.config.effectiveEnv` records the build's resolved environment variables and their origin. A backend environment override is reported as `BACKEND_OVERRIDES` and can be made available during `BUILD` and `RUNTIME`.

RFxchange therefore does not infer source identity from an undocumented managed-build variable. An operator binds the already-reviewed exact main SHA to the documented backend override `RFXCHANGE_BUILD_SHA`, triggers an exact-commit rollout, and accepts the release only when Firebase reports the same full SHA as the immutable source hash and as the resolved build variable.

## Participant-language reconciliation

Build identity is release-engineering data. Current participant-language tests intentionally prohibit source/build SHA and release-governance text from ordinary public or participant-facing pages.

2C therefore does **not** restore a public SHA footer or add participant-visible diagnostics. The proof is held in release evidence:

```text
exact merged main SHA
= exact-head successful CI source SHA
= Firebase Build.source.codebase.hash
= Firebase Build.config.effectiveEnv[RFXCHANGE_BUILD_SHA]
= source bound into Next generateBuildId contract
= App Hosting Rollout.build
```

The existing build-identity test separately proves that `next.config.ts` uses a complete `RFXCHANGE_BUILD_SHA` as the Next build ID and that exact-head CI verifies `.next/BUILD_ID` against the reviewed checkout SHA.

## Required release sequence

### 1. Choose one exact merged `main` commit

The candidate must already be merged to `main`. Record the complete 40-character SHA and the successful GitHub Actions `production-ci` run for that exact SHA.

Do not release a PR head, merge preview, abbreviated SHA, mutable branch name or rollout identifier as source identity.

### 2. Bind `RFXCHANGE_BUILD_SHA` on the App Hosting backend

Immediately before the exact-commit rollout, set the backend environment override:

```text
RFXCHANGE_BUILD_SHA=<exact 40-character merged-main SHA>
availability: BUILD, RUNTIME
```

This value is non-secret release configuration. Keep automatic rollouts paused so another source commit cannot build while a previous SHA override is still present.

The backend override may be set in the Firebase App Hosting environment-variable UI or through the documented App Hosting backend API. If the API is used, preserve every unrelated existing backend override and patch only after reading the current backend state; never replace the override list from an assumed local copy.

### 3. Trigger the exact commit

Use Firebase's documented exact-commit manual rollout command:

```bash
firebase apphosting:rollouts:create rfxchange \
  --project rfxchange \
  --location us-east4 \
  --git_commit "$RFXCHANGE_BUILD_SHA"
```

Do not re-enable automatic rollouts as part of this proof.

### 4. Capture Firebase's resolved build and rollout resources

After the rollout completes, identify its full App Hosting rollout resource name and the previous known-good build to retain as rollback.

The rollout must be `SUCCEEDED` and its `build` field must name the same build whose:

- `state` is `READY`;
- `source.codebase.hash` equals the exact merged-main SHA; and
- resolved `RFXCHANGE_BUILD_SHA` equals that same SHA, has origin `BACKEND_OVERRIDES`, and is available for both `BUILD` and `RUNTIME`.

### 5. Capture and verify evidence

With a Google Cloud access token available either through `RFXCHANGE_APPHOSTING_ACCESS_TOKEN` or `gcloud auth print-access-token`, run:

```bash
export RFXCHANGE_BUILD_SHA="<full merged-main SHA>"
export RFXCHANGE_APPHOSTING_ROLLOUT_NAME="projects/rfxchange/locations/us-east4/backends/rfxchange/rollouts/<rollout-id>"
export RFXCHANGE_APPHOSTING_ROLLBACK_BUILD="projects/rfxchange/locations/us-east4/backends/rfxchange/builds/<previous-known-good-build>"
export RFXCHANGE_CI_RUN_URL="https://github.com/AccelAnalysis/RFxchange/actions/runs/<run-id>"

node scripts/capture-app-hosting-same-sha-evidence.mjs
node scripts/verify-app-hosting-same-sha-evidence.mjs artifacts/app-hosting-same-sha-evidence.json
```

The capture command reads the backend, rollout and build from the official App Hosting REST API, confirms the production origin is reachable, writes the evidence file, and then runs the same fail-closed verifier used by repository tests.

Do not put OAuth tokens, service-account JSON, Stripe credentials, Microsoft credentials, OpenAI credentials or other secrets into the evidence file.

## Acceptance criteria

2C can be marked complete only when one production release has all of the following:

- exact merged-main SHA recorded;
- successful exact-head `production-ci` for that SHA;
- Firebase `Build.source.codebase.hash` equal to that SHA;
- Firebase resolved `RFXCHANGE_BUILD_SHA` equal to that SHA from `BACKEND_OVERRIDES`, available at `BUILD` and `RUNTIME`;
- build state `READY`;
- rollout state `SUCCEEDED` and bound to that exact build;
- reserved production origin reachable after rollout;
- explicit previous known-good App Hosting build retained as rollback target; and
- `scripts/verify-app-hosting-same-sha-evidence.mjs` accepts the captured evidence.

A repository change alone does not complete 2C. The live evidence must exist for the exact production rollout.

## Ongoing release rule

Because `RFXCHANGE_BUILD_SHA` is commit-specific, every later manual production rollout must update the backend override to the exact commit being released before the build starts and must keep exact-commit release sequencing serialized while automatic rollouts remain disabled.

A later migration to an authenticated CI/CD release workflow may automate the same sequence. It must still preserve the same invariants: exact reviewed source, per-release SHA binding, documented App Hosting source hash, resolved environment proof, exact rollout binding, rollback target, and no participant-visible implementation metadata.
