# RFx prototype version 2 design reference

Status: **current RFx visual/interaction reference for the decisions listed here**

Date/source: RFx process HTML prototype iteration 2, reviewed August 2026.

Relevant features/slices: future Wave 4 RFx Core, Brand Gate B6c and Wave 5 evaluator surfaces.

## Demonstrates

The following decisions are adopted:

- small tracked gold eyebrow above a strong larger task heading;
- concise supporting copy;
- one focal action per step;
- continuous table/row treatment for capabilities, response sections and decision factors;
- reduced borders/cards/container chrome;
- quiet accessible row removal rather than oversized red buttons;
- connected, prominent lifecycle/process presentation;
- split publication-readiness composition;
- operational surfaces that feel premium and restrained rather than dashboard-like;
- map context only where geography materially supports the task.

## Does not define

The prototype does not define:

- production framework/component code;
- API/domain/storage contracts;
- authorization or permissions;
- Firebase schema;
- real map/geocoding implementation;
- production data;
- AMACS ingestion/runtime architecture;
- accessibility implementation details;
- final responsive breakpoints;
- current Feature-ID completion.

## Known differences from production

Production will:

- use the existing Next.js/React application and B1/B2 primitives;
- use the existing real Mapbox/Census/geocoding workspace;
- use server-authoritative organization/RFx/response/team records;
- ingest the complete immutable AMACS release through an application port;
- use real permissions, audit events and lifecycle transitions;
- localize only RFxchange-controlled UI while preserving participant-authored content;
- contain no simulated counterpart controls or fictional live market objects.

## Later-prototype regressions explicitly rejected

Do not copy these later-prototype regressions into production:

- isolated rounded card around every capability/section/factor;
- oversized red `Remove` buttons for ordinary row editing;
- native select containing hundreds of AMACS capabilities;
- user-facing `Add local section` / `Add local factor`;
- rudimentary browser prompt-based authoring;
- tiny disconnected lifecycle pills;
- user-facing source commit/AMACS technical IDs as primary content;
- fake map or static pixel-position markers;
- internal/canonical/projection vocabulary in ordinary participant screens.

## Production implementation rule

Preserve the intended interaction/hierarchy through the production architecture. Do not copy the prototype HTML, CSS, JavaScript, sample organizations or simulated transaction state wholesale.
