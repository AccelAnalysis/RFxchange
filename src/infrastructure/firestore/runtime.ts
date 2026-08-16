import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminApp } from "../firebase/admin.ts";
import {
  createFirestoreFoundationRepositories,
  type FirestoreFoundationRepositories,
} from "./repositories.ts";

/**
 * Server-only Firestore composition boundary.
 *
 * Firebase Admin application initialization is shared with Authentication through the dedicated
 * infrastructure Firebase boundary. No service-account key is accepted here.
 */
export function getServerFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function createServerFirestoreFoundationRepositories(
  db: Firestore = getServerFirestore(),
): FirestoreFoundationRepositories {
  return createFirestoreFoundationRepositories(db);
}
