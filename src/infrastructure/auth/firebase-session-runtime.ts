import { FirebaseUserIdentityResolver } from "./firebase-user-resolution.ts";
import { FirebaseServerSessionBoundary } from "./firebase-server-session.ts";
import { getServerFirebaseAuth } from "./firebase-server.ts";
import { createServerFirestoreFoundationRepositories } from "../firestore/runtime";

export function createServerAuthenticationBoundary(): FirebaseServerSessionBoundary {
  const repositories = createServerFirestoreFoundationRepositories();
  const resolver = new FirebaseUserIdentityResolver(repositories.users.users);
  return new FirebaseServerSessionBoundary(getServerFirebaseAuth(), resolver);
}
