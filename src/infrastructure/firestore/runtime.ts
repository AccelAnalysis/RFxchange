import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import {
  createFirestoreFoundationRepositories,
  type FirestoreFoundationRepositories,
} from "./repositories";

/**
 * Server-only Firebase Admin composition boundary.
 *
 * No service-account key is accepted here. In Google-hosted runtimes the Admin SDK resolves
 * Application Default Credentials. Local development should point this runtime at the Firestore
 * emulator; remote credential strategy remains an environment/deployment concern.
 */
export function getFirebaseAdminApp(): App {
  return getApps()[0] ?? initializeApp();
}

export function getServerFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function createServerFirestoreFoundationRepositories(
  db: Firestore = getServerFirestore(),
): FirestoreFoundationRepositories {
  return createFirestoreFoundationRepositories(db);
}
