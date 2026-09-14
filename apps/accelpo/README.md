# AccelPO chassis

AccelPO is the separate, task-first purchasing PWA for the RFxchange ecosystem. This folder is
the P0 chassis and CP-02 RouteSurface: install metadata, one responsive shell, one route registry,
navigation, focused purchase creation, and the stable connection-point contracts that later parts
consume.

The preview is intentionally front-end only. It uses a clearly marked preview workspace so that
no sample purchase, organization, amount, approval, or supplier activity is presented as live
platform data. Consequential actions will be connected to the shared RFxchange Firebase identity,
organization, authorization, policy, file, notification, RFxBridge, marketing, and entitlement
services as their parts are added.

## Navigation

`Home` · `Purchases` · `+ New` · `Tasks` · `Organization`

Hash routes keep the static GitHub Pages preview deep-linkable without inventing a second router.
The route registry supports bounded route contributions for later parts and includes a direct
Purchase Case detail route (`#purchase/:caseId`).

## Chassis ports

The typed registry in `src/chassis/ports.ts` declares CP-01 through CP-10. `registry.ts` contains
the minimal part registry and registers CP-02 as the shell-owned route surface, alongside CP-03’s
single command transport and CP-04’s read boundary.
The shell does not create parallel authentication, database, billing, notification, or
supplier-network infrastructure.

CP-04 QueryProjection is registered in the chassis registry and exposes typed organization-scoped
projections for organization context, people and invitations, Purchase Cases, tasks, notifications,
providers, offers, budgets, evidence metadata, and fulfillment. The query service requires a
server-held access resolver, applies an organization constraint at the source, and builds responses
from explicit field allowlists. It never returns raw records, storage paths, private comments, or
budget data without the resolved capability.

## Local preview

Open `index.html` through a static server, for example:

```bash
npx serve apps/accelpo
```
