import { createServerFirestoreFoundationRepositories } from "../firestore/runtime";
import { FirebaseUserIdentityResolver } from "./firebase-user-resolution";

/** Server-only production composition for AUTH-002. */
export function createServerFirebaseUserIdentityResolver(): FirebaseUserIdentityResolver {
  return new FirebaseUserIdentityResolver(
    createServerFirestoreFoundationRepositories().users.users,
  );
}
