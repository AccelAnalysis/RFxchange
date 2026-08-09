# Post-Wave 3 Stabilization 2B — Build Identity Exposure

## Purpose

Make the exact source commit of an RFxchange application build visible and machine-verifiable without changing product Feature IDs, tracker totals, domain authority, or participant state.

## Identity contract

`RFXCHANGE_BUILD_SHA` is the canonical build-time input. For pull-request CI, GitHub Actions explicitly checks out `github.event.pull_request.head.sha` and supplies that same reviewed head SHA to the production build. For `main` push CI, the workflow falls back to `github.sha`. `next.config.ts` accepts only a complete 40-character hexadecimal Git SHA, lowercases it, embeds it into the compiled application environment, and uses the same value as Next.js `BUILD_ID`.

`GITHUB_SHA` remains a build-time fallback for environments that already expose GitHub's commit identity. Invalid, missing, abbreviated, or non-hexadecimal values are not presented as a valid RFxchange build identity.

Runtime environment changes cannot relabel an already-compiled artifact because the value consumed by application code is frozen through Next.js build configuration.

## Visible surfaces

- Public marketing footer: `SHA <12-character prefix>` with the complete SHA in rendered title metadata.
- Authenticated Account workspace: complete `Build SHA` under the existing Current release boundary.

These are release-support metadata only. A build SHA grants no organization, membership, lifecycle, entitlement, restriction, credibility, provider, RFx, or administrative authority.

## CI proof

Production CI binds `RFXCHANGE_BUILD_SHA` to the exact source SHA checked out for that event and runs `npm run build`. After the build, CI first requires `.next/BUILD_ID` to equal that same SHA. It then starts the compiled Next production server and requests the public root page, requiring the rendered HTML to contain both the complete SHA in the footer title metadata and the visible 12-character `SHA` prefix.

Architecture coverage additionally proves the validated identity source, exact-head checkout/build binding, compiled-server verification, and both visible projections remain connected to the same contract.

## Boundary to Stabilization 2C

2B proves that a built artifact identifies itself. It does **not** yet prove that a production deployment serves the artifact built from the intended `main` SHA. Stabilization 2C must deploy one exact source/build identity and capture post-deployment evidence that the served release reports that same SHA.
