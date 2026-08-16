import { getAuth, type Auth } from "firebase-admin/auth";

import { getFirebaseAdminApp } from "../firebase/admin.ts";

/**
 * Server-side Firebase Authentication provider handle.
 *
 * AUTH-001 exposes the provider. AUTH-003 will define how verified Firebase credentials become an
 * RFxchange authenticated server session; callers must not treat a Firebase UID as a UserId.
 */
export function getServerFirebaseAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
