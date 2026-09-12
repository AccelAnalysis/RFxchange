import { BrandWordmark } from "../brand/BrandWordmark";
import { AdminSignOut } from "./AdminSignOut";
import { exchangeOrigin } from "../../application/platform/exchange-origin";
import type { AdminPortalAccessResolution } from "../../infrastructure/auth/admin-route-runtime";
import styles from "./AdminAccessRecovery.module.css";

type DeniedAccess = Exclude<AdminPortalAccessResolution, { kind: "authorized" | "unauthenticated" }>;

function recoveryCopy(access: DeniedAccess): { title: string; detail: string } {
  if (access.kind === "not-administrator") return {
    title: "Administrator access is not configured.",
    detail: "You are signed in, but this account is not linked to a complete administrator profile. A platform owner or authorized administrator needs to review your account's access.",
  };
  if (access.kind === "no-implemented-destination") return {
    title: "No Admin workspaces are assigned.",
    detail: "Your administrator profile has no active permission grant for an available workspace. An authorized administrator needs to review the permissions and scope assigned to your account.",
  };
  switch (access.reason) {
    case "mfa-required": return {
      title: "Additional account security is required.",
      detail: "Your administrator account requires multi-factor authentication. Complete the required account-security setup before returning to Admin.",
    };
    case "credential-reset-required": return {
      title: "Your account requires a password reset.",
      detail: "An administrator has required a credential reset for this account. Complete the approved account-recovery process before returning to Admin.",
    };
    case "administrator-locked": return {
      title: "Administrator access is locked.",
      detail: "An authorized administrator must review this account's security restriction before you can open Admin workspaces.",
    };
    case "administrator-disabled":
    case "administrator-removed":
    case "provider-account-disabled": return {
      title: "Administrator access is inactive.",
      detail: "This account cannot currently open Admin workspaces. An authorized administrator must review its access status.",
    };
    case "provider-credential-revoked":
    case "recent-reauthentication-required": return {
      title: "Sign in again to continue.",
      detail: "Your account needs a fresh sign-in before it can open Admin workspaces. Sign out below, then sign in again.",
    };
  }
}

/** An authenticated entry recovery view; it exposes no administrative records or grants. */
export function AdminAccessRecovery({ access }: Readonly<{ access: DeniedAccess }>) {
  const copy = recoveryCopy(access);
  const origin = exchangeOrigin(process.env.NEXT_PUBLIC_RFXCHANGE_EXCHANGE_ORIGIN)
    ?? "https://rfxchange--rfxchange.us-east4.hosted.app";
  return <main className={styles.page}>
    <header className={styles.header}><BrandWordmark compact /><span>Administration</span></header>
    <section className={styles.card} aria-labelledby="admin-access-title">
      <p className={styles.eyebrow}>RFxchange Admin</p>
      <h1 id="admin-access-title">{copy.title}</h1>
      <p className={styles.identity}>Signed in as <strong>{access.context.user.primaryEmail}</strong></p>
      <p>{copy.detail}</p>
      <p>If you intended to use a different account, sign out and choose that account.</p>
      <div className={styles.actions}>
        <a className={styles.primary} href="/admin">Check access again</a>
        <a href={`${origin}/signin`}>Open Exchange</a>
      </div>
      <AdminSignOut />
    </section>
  </main>;
}
