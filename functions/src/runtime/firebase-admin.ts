import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let functionsAdminApp: App | null = null;
let functionsFirestore: Firestore | null = null;

export function getFunctionsAdminApp(): App {
  if (functionsAdminApp) return functionsAdminApp;
  functionsAdminApp = getApps().length > 0 ? getApp() : initializeApp();
  return functionsAdminApp;
}

export function getFunctionsFirestore(): Firestore {
  if (functionsFirestore) return functionsFirestore;
  functionsFirestore = getFirestore(getFunctionsAdminApp());
  return functionsFirestore;
}
