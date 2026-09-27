# Wave 1 Slice 1.16 — ADM-088

## Scope

This slice implements `ADM-088` — Privileged administrator security baseline.

It builds directly on ADM-017's administrator credential/session controls and keeps privileged security separate from ordinary user authentication policy.

## Default privileged policy

The baseline is intentionally stricter than the normal-user authentication foundation:

- MFA required;
- maximum privileged session age: 30 minutes;
- maximum idle time: 15 minutes;
- sensitive administrative actions require authentication no older than 5 minutes;
- every privileged login produces a notification intent;
- first use of a device produces a new-device security event and notification intent;
- anomalous risk signals produce a security event and alert intent;
- production authority is separate from ordinary privileged authorization.

## Session and device management

Privileged sessions and devices have independent stable IDs and revocation state.

A session records:

- administrator;
- device;
- creation/authentication/MFA timestamps;
- last activity;
- revocation state;
- optional explicit production-authority evidence.

A device records first/last use and can be revoked. Device revocation can cascade to active privileged sessions through the application service.

## Login and anomaly notifications

The domain emits provider-neutral notification intents for:

- every privileged login;
- a new privileged device;
- anomalous privileged access.

Delivery remains behind `PrivilegedSecurityNotificationPort`; this slice does not couple admin security to an email/SMS vendor and does not claim later COMMS/NTF features.

## Risk signals

The baseline recognizes explicit risk signals including:

- new device;
- impossible travel;
- provider risk;
- repeated authentication failure;
- unexpected production request.

Risk evidence is written to append-only privileged security events. Higher-level automated incident workflows remain later Trust & Safety work.

## Production authority separation

Ordinary role/permission authority does not automatically authorize production operations. A privileged session has no production authority by default.

Where production access is requested, the session must carry separate time-bounded authority evidence that:

- belongs to the administrator;
- is granted by a different administrator;
- has begun;
- has not expired.

This is session-security separation only. ADM-019 and ADM-049 continue to define reserved-action and technical-versus-marketplace policy boundaries.

## Least privilege and authorization composition

Passing the privileged security gate never grants an administrative permission. The caller may require a named permission during session evaluation, and the existing ADM-011 through ADM-015 authorization layers remain authoritative for role, permission, scope and conditions.

Immediate ADM-016/ADM-017 disable/lock state is evaluated on every privileged access decision, so an existing session cannot outlive an administrator security disable.

## Persistence

Firestore server-side persistence is defined for:

- `privilegedAdministratorSessions`;
- `privilegedAdministratorDevices`;
- `privilegedAdministratorSecurityEvents`.

Security events are append-only at the repository boundary. Browser access remains default-denied by the existing Firestore Rules posture.

## Acceptance

ADM-088 is complete only when tests prove:

1. MFA is mandatory for privileged login;
2. privileged session and idle windows are shorter than normal user session expectations;
3. sensitive access requires recent re-authentication;
4. sessions and devices can be independently revoked;
5. every login generates notification intent;
6. new-device and anomaly signals generate alerts/security events;
7. lifecycle disable/lock state blocks existing sessions immediately;
8. production access requires separate non-self-granted, time-bounded evidence;
9. passing privileged security does not bypass named permission authorization;
10. security-event persistence is append-only;
11. the full repository production CI suite remains green.
