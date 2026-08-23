# Hampton Roads Provider Firebase Promotion — Implementation Evidence

**Status:** Implemented — Not Verified

**Date:** 2026-08-23

**Pull request:** #251

**Base packet:** #250 — governed comparison and approval

## Implemented boundary

The packet introduces a server-only promotion service and Firestore transaction adapter for an explicitly approved source-backed provider seed.

The service:

- resolves the current platform administrator authority context;
- requires the dedicated `provider.seed.promote` permission with GLOBAL scope and satisfied pre-resolved conditions;
- reloads persisted source, candidate, Geography Fabric, canonical-search, comparison, and approval evidence;
- recomputes deterministic SHA-256 fingerprints over normalized evidence;
- rejects stale, cross-bound, or authority-mismatched requests;
- supports approved new-Organization creation or attachment to the exact reviewed existing Organization;
- produces a source-backed imported-location fact rather than fabricating participant location confirmation;
- produces a non-published provider seed draft rather than fabricating Official Resource Provider approval or participant-authored Resource publication;
- records a committed receipt and append-only event;
- keeps preview free of writes.

The Firestore unit of work:

- re-reads all promotion evidence in one transaction;
- checks canonical Organization availability or exact existing identity;
- materializes or verifies Geography Fabric catalog, version, profile, membership, command, and event records;
- writes the source-backed location and provider seed draft;
- writes idempotent promotion command, event, and receipt facts;
- rejects command-ID reuse with conflicting evidence;
- never writes participant-confirmed Organization Locations, Provider applications, Official Provider profiles, Provider Resources, or provider discovery publications.

## Explicitly absent

This packet does not:

- execute a real production provider import;
- approve any source candidate;
- create a user or Organization membership;
- assert participant authority;
- grant Official Resource Provider status;
- publish provider discovery;
- publish a Resource;
- activate a participant map marker;
- bypass the ordinary Organization claim workflow.

## Evidence expectations

The packet remains **Implemented — Not Verified** until exact-head production CI and independent review/acceptance are complete. This implementation record does not self-certify completion.
