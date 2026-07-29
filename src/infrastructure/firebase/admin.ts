import { getApps, initializeApp, type App } from "firebase-admin/app";

/**
 * Shared server-only Firebase Admin application boundary.
 *
 * No long-lived service-account credential is accepted here. Managed Google/Firebase runtimes
 * should resolve Application Default Credentials; local emulator development does not require a
 * production service-account key.
 */
export function getFirebaseAdminApp(): App {
  return getApps()[0] ?? initializeApp();
}
