import { getServerFirebaseAuth } from "./firebase-server.ts";
import { FirebaseAccountSecurityService } from "./firebase-account-security.ts";

/** Server-only production composition for AUTH-004 provider account-security operations. */
export function createServerFirebaseAccountSecurityService(): FirebaseAccountSecurityService {
  return new FirebaseAccountSecurityService(getServerFirebaseAuth());
}
