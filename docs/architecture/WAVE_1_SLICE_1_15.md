# Wave 1 Slice 1.15 — ADM-016 + ADM-017

## Scope

This slice implements:

- `ADM-016` — Administrator lifecycle management
- `ADM-017` — Administrator credential and session controls

The slice builds on the named-permission, role-preset, multi-role override, scoped-grant and conditional-action foundations from Slices 1.10–1.14.

## Administrative lifecycle

A platform administrator is represented by a provider-neutral account record containing:

- stable administrator ID;
- authentication-provider subject;
- protected-account flag;
- lifecycle status (`active`, `disabled`, `removed`);
- role configuration;
- explicit scope limits;
- privileged-security state;
- creation/update timestamps.

Lifecycle operations are explicit named capabilities rather than a hard-coded Super Admin role check:

- `admin.lifecycle.create`
- `admin.lifecycle.access.manage`
- `admin.lifecycle.disable`
- `admin.lifecycle.remove`

The default Super Admin preset receives the complete permission catalog and therefore receives these capabilities. Ordinary Platform Administrator and other presets do not receive them by default.

Protected administrator accounts cannot be modified through ordinary lifecycle operations. A non-protected administrator must be disabled before removal.

## Access administration

Authorized lifecycle operations can replace an administrator's configured:

- role preset assignments;
- explicit permission additions;
- explicit permission removals;
- allowed `GLOBAL`, `GEOGRAPHY`, `ORGANIZATION`, or `CASE` scope limits.

The actual permission resolver from ADM-013 remains authoritative. Scope-specific action enforcement remains in ADM-014; Slice 1.15 supplies the managed scope-limit state used when reviewing or administering the account.

## Privileged credential and session controls

The following named capabilities are added:

- `admin.security.lock`
- `admin.security.credential-reset.require`
- `admin.security.mfa.require`
- `admin.security.reauthentication.require`
- `admin.security.session.terminate`

These operations only restrict access. They never grant marketplace, credibility, commerce, RFx, organization, or other administrative permissions.

The RFxchange security state records whether an administrator is locked, must reset credentials, must enroll MFA, must authenticate after a specific timestamp, or has had privileged sessions terminated.

Provider-side enforcement is behind a port. The Firebase adapter reuses the AUTH-004 account-security service:

- lock/disable -> disable the Firebase identity and revoke refresh tokens;
- reset/MFA/re-auth/session termination -> revoke refresh tokens;
- RFxchange persisted security state supplies the additional policy gate for reset/MFA/re-auth requirements.

## Privileged access gate

`evaluatePrivilegedAdministratorAccess` denies privileged access for:

- removed administrator;
- disabled administrator;
- locked administrator;
- required credential reset;
- missing required MFA enrollment;
- disabled provider identity;
- provider credential revoked by token-valid-after state;
- authentication that is not newer than the configured re-authentication requirement.

The gate is restrictive only. Passing it does not grant any administrative action; normal permission/scope/condition authorization still follows.

## Audit evidence

Every lifecycle/security mutation returns an immutable `PlatformAdministratorLifecycleEvent` containing:

- actor administrator ID;
- target administrator ID;
- exact permission exercised;
- action identifier;
- required reason;
- timestamp;
- before snapshot;
- after snapshot.

The Firestore adapter stores administrator state in `platformAdministrators` and append-only lifecycle evidence in `platformAdministratorLifecycleEvents`. This focused lifecycle evidence does not claim completion of ADM-085's future platform-wide administrative audit log.

## Acceptance

Slice 1.15 is complete only when tests prove:

1. lifecycle/security permissions are catalogued and default only to Super Admin;
2. authorized creation and access administration work with explicit scopes;
3. ordinary Platform Administrator cannot execute lifecycle operations;
4. protected accounts reject ordinary lifecycle/security mutations;
5. removal requires prior disable;
6. every mutation produces before/after audit evidence;
7. lock/reset/MFA/re-auth/session controls produce restrictive state;
8. provider identity disable/session revocation are invoked by application services;
9. privileged-access checks enforce the persisted and provider-side security state;
10. the full repository CI suite remains green.
