# RFxchange Reference Artifacts

This directory contains provenance and product-reference material that may help explain why a requirement exists or what an experience should look like.

Reference artifacts are **not automatically production architecture**.

## Structure

- `source-documents/` — catalog of approved source materials and how normalized context maps back to them.
- `prototypes/` — HTML/interactive proof-of-concept references and companion implementation notes.
- `screenshots/` — curated visual references with explicit statements of what each image demonstrates.

## Authority rule

When reference material differs from the current canonical tracker, dependency map, approved slice brief, normalized product context or merged security architecture, do not copy the reference literally. Determine whether the reference represents outdated mechanics, intentional UX direction or a genuine unresolved product conflict.

## Adding an artifact

Every prototype or screenshot should have a companion note or manifest entry stating:
- what product behavior/visual principle it demonstrates,
- what it does **not** define,
- date/source,
- relevant Feature IDs/slices,
- whether it is current, superseded or exploratory.
