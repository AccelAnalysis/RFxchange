import type { UserAccess360Projection } from "../../application/admin/user-access-360";

export interface UserAccess360Props {
  readonly user: UserAccess360Projection;
}

export function UserAccess360({ user }: UserAccess360Props) {
  return (
    <section className="admin-user-360" aria-labelledby="admin-user-360-title">
      <header>
        <p className="eyebrow">Users &amp; Access</p>
        <h1 id="admin-user-360-title">{user.identity.name}</h1>
        <p>{user.identity.email}</p>
      </header>

      <div className="admin-user-360-grid">
        <article>
          <h2>Identity &amp; authentication</h2>
          <dl>
            <dt>User ID</dt><dd>{user.identity.id}</dd>
            <dt>Provider</dt><dd>{user.identity.authenticationProvider}</dd>
            <dt>Authentication state</dt><dd>{user.identity.mfaEnabled ? "MFA enabled" : "MFA not enabled"}</dd>
            <dt>Last login</dt><dd>{user.authenticationState.lastLoginAt ?? "No login recorded"}</dd>
          </dl>
        </article>

        <article>
          <h2>Organization access</h2>
          {user.memberships.length === 0 ? <p>No organization memberships.</p> : (
            <ul>
              {user.memberships.map((membership) => (
                <li key={membership.membershipId}>
                  <strong>{membership.organizationName ?? membership.organizationId}</strong>
                  <span>{membership.status}</span>
                  <span>{membership.roleKey ?? "No role assigned"}</span>
                  <small>{membership.permissions.join(", ") || "No explicit permissions"}</small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article>
          <h2>Platform role</h2>
          {user.platformRole ? (
            <dl>
              <dt>Status</dt><dd>{user.platformRole.status}</dd>
              <dt>Roles</dt><dd>{user.platformRole.rolePresetKeys.join(", ")}</dd>
              <dt>Scope</dt><dd>{user.platformRole.scopeLimits.join(", ")}</dd>
            </dl>
          ) : <p>No platform administrator role.</p>}
        </article>

        <article>
          <h2>Granular permissions</h2>
          <p>{user.granularPermissions.join(", ") || "No granular permissions."}</p>
        </article>

        <article>
          <h2>Security &amp; restrictions</h2>
          <p>{user.securityEvents.length} security event(s)</p>
          <p>{user.restrictions.length} restriction record(s)</p>
        </article>

        <article>
          <h2>Invitations &amp; policy</h2>
          <p>{user.invitations.length} invitation(s)</p>
          <ul>
            {user.termsVersionsAccepted.map((term) => (
              <li key={`${term.organizationId}-${term.kind}-${term.version}`}>
                {term.kind}: {term.version} ({term.status})
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h2>Recent actions</h2>
          {user.recentActions.length === 0 ? <p>No recent actions.</p> : (
            <ul>
              {user.recentActions.map((action) => (
                <li key={`${action.occurredAt}-${action.action}-${action.target}`}>
                  <strong>{action.action}</strong> — {action.target}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
