# Open Exchange Progressive Availability Gate

**Status:** IMPLEMENTED — NOT VERIFIED  
**Source authority:** explicit participant-facing product direction in the current task  
**Implementation base:** `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`  
**Owner:** Lane 01 shared participant experience

## Decision

The Exchange map shell is available to an authenticated participant as soon as the existing
server-authoritative controlled-platform prerequisites are satisfied. Orientation, first-value
selection, and the complete OPEN release gate no longer block access to that shell.

The permanent lens architecture and marker action row remain visible. Actions that still require
OPEN are unavailable, non-navigable, visually muted, and semantically identified with
`aria-disabled="true"` plus plain-language availability copy. Organization Profile remains
available because it is the safe setup utility that helps a participant improve the real record
already represented on the map.

## Authority preserved

This presentation change does not:

- promote a controlled lifecycle to OPEN;
- bypass membership, organization, restriction, geography, location, marker, or privacy checks;
- expose private Resources, Referrals, RFx, provider, or education records;
- create fabricated map objects or placeholder records;
- claim completion of any Feature ID, work packet, tracker row, or independent acceptance; or
- merge or deploy this candidate without the repository's existing review and acceptance process.

Direct visits to protected domain routes continue to enforce their server-side OPEN checks. The
canonical `/exchange` entry resolves to `/geography/canvas`, which revalidates participant and map
authority and projects only permitted real organization records.

## Acceptance contract

- controlled and OPEN participants with a valid organization resolve to `/exchange`;
- `/exchange` preserves bounded acquisition intent and enters the canonical map route;
- controlled participants can search, pan, select permitted organization markers, and inspect the
  synchronized list/detail projection;
- Opportunities/RFx, Resources, Referrals, Quick Start, and their marker actions remain visible but
  unavailable for controlled participants;
- Organization Profile remains available;
- OPEN participants retain the existing enabled lens and action behavior;
- unavailable state is expressed through text and semantics, not color alone;
- five supported locales contain the map-action availability explanation; and
- all existing tenancy, security, restriction, geography, and privacy checks remain authoritative.

Independent acceptance and integration remain separate from this implementation disposition.
