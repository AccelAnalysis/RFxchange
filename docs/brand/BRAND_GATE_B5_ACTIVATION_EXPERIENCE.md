# Brand Gate B5 — Activation Experience

**Status: IMPLEMENTED ON THE AUTHORIZED B5 BRANCH — FINAL CI AND MERGE REQUIRED BEFORE B6a**

## Objective

Brand Gate B5 makes onboarding and organization activation the first branded product demonstration while preserving every completed Wave 2 authority and acceptance boundary.

## Baseline

B5 branches from merged Brand Gate B4 `main` at:

`c4081de0d4f78109a654fd7f8fb3257df6910c68`

The tracker remains **438 total · 121 Done · 317 Not Started**. Brand gates do not alter Feature-ID state.

## Converged activation experience

B5 applies the semantic Exchange Light system to:

- account registration and sign-in modes;
- legal acceptance;
- locality typeahead and Census-authoritative selection;
- organization resolution and authority explanation;
- location candidate and confirmation;
- essential capability/profile forms;
- progress and completion states;
- acquisition-context continuity;
- errors, notices, success, and recovery controls;
- map-overlay panels and workspace handoff.

The current activation logic remains authoritative. B5 does not replace or duplicate the Wave 2 state machine.

## Spatial continuity

`SpatialActivationExperience` continues to:

- reveal the map after an activation state exists;
- refresh the spatial model after locality selection;
- transition from regional to locality to organization context;
- fetch the authoritative home marker only after marker activation;
- preserve ExchangeSpatialScene camera and node authority;
- enter the authenticated workspace after the organization node becomes visible.

B5 adds a calm live status explaining that progress is preserved and identifying the current step. When the marker becomes authoritative, the status changes to:

> **Your organization is now visible. Entering The RFxchange.**

Reduced-motion preference replaces the cinematic delay with an immediate accessible handoff and removes visual translation.

## Preserved Wave 2 boundaries

B5 preserves:

- account-only participant access;
- real Terms, Rules, and Privacy links;
- email-verification boundary before organization authority;
- Census locality typeahead and server-side resolution;
- organization claim/create/conflict authority;
- Census geocoding and private location candidate handling;
- available-website and no-public-website paths;
- essential capability/profile requirements;
- real marker visibility and activation;
- synthetic orientation isolation;
- first-value choice and server-authoritative OPEN gating;
- acquisition context without authority escalation;
- reload, resume, sign-out, and sign-in continuity.

## Registration model integrity

B5 does not reintroduce:

- organization type as a requirement;
- descriptive participation roles as product permissions;
- business objectives during activation;
- Official Resource Provider self-selection;
- organization name fields on sign-in-only mode;
- paid membership as an activation condition.

The existing relationship field remains descriptive and explicitly does not grant authority.

## Accessibility and sensory behavior

B5 adds or preserves:

- visible focus for all inputs, links, choices, and actions;
- semantic progress/current/completed treatments;
- readable dark-gold eyebrow text on Warm Ivory;
- responsive form and progress layouts;
- reduced-motion and reduced-transparency alternatives;
- live status for spatial continuity;
- no activation audio or ungoverned sonic hook.

## Explicit non-scope

B5 does not change activation APIs, domain state transitions, authorization, Firestore authority, geocoding, marker coordinates, camera signatures, orientation records, OPEN logic, Feature IDs, tracker totals, or dependencies.

## Exit

B5 completes only after repository, Firebase, architecture, TypeScript, lint, production build, and applicable activation acceptance pass on the final implementation head and the PR merges into `main`. Brand Gate B6a — Existing Workspace Foundation begins only from merged B5 `main`.
