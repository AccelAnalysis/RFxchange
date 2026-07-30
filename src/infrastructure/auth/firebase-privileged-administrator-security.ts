import type { PrivilegedAdministratorIdentitySecurityPort } from "../../application/admin/administrator-lifecycle-service.ts";
import { FirebaseAccountSecurityService } from "./firebase-account-security.ts";

/**
 * Provider adapter for privileged administrator security controls.
 *
 * Lifecycle/access policy remains provider-neutral. Firebase Auth is used only for the
 * provider-side effects that are security-critical today: disabling sign-in and revoking
 * refresh tokens. Credential-reset/MFA/re-authentication requirements are persisted in the
 * RFxchange administrator security state and enforced by the privileged-access gate.
 */
export class FirebasePrivilegedAdministratorSecurityPort
  implements PrivilegedAdministratorIdentitySecurityPort
{
  private readonly accountSecurity: FirebaseAccountSecurityService;

  constructor(accountSecurity: FirebaseAccountSecurityService) {
    this.accountSecurity = accountSecurity;
  }

  async disable(subject: string): Promise<void> {
    await this.accountSecurity.disable(subject);
  }

  async revokeSessions(subject: string): Promise<void> {
    await this.accountSecurity.revokeSessions(subject);
  }
}
