import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

function configured(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

/**
 * Resolve the Firebase project that the server-side Admin SDK is allowed to trust.
 *
 * `RFXCHANGE_EXPECTED_PROJECT_ID` is the server authority. The public Firebase web project must
 * match it when both are configured so a browser token minted by one project cannot be exchanged
 * against a different RFxchange server authority.
 */
export function firebaseAdminProjectIdFromEnvironment(): string {
  const expectedProjectId = configured(process.env.RFXCHANGE_EXPECTED_PROJECT_ID);
  const publicProjectId = configured(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const googleProjectId =
    configured(process.env.GOOGLE_CLOUD_PROJECT) ?? configured(process.env.GCLOUD_PROJECT);

  if (expectedProjectId && publicProjectId && expectedProjectId !== publicProjectId) {
    throw new Error(
      "Firebase project configuration mismatch: RFXCHANGE_EXPECTED_PROJECT_ID must match NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  const projectId = expectedProjectId ?? publicProjectId ?? googleProjectId;
  if (!projectId) {
    throw new Error(
      "Firebase Admin project ID is not configured. Set RFXCHANGE_EXPECTED_PROJECT_ID to the Firebase project used by RFxchange.",
    );
  }
  return projectId;
}

/**
 * Shared server-only Firebase Admin application boundary.
 *
 * Google-managed runtimes resolve Application Default Credentials from their runtime identity.
 * Local development against a real Firebase project must provide ADC (for example through a
 * GOOGLE_APPLICATION_CREDENTIALS path to a local, uncommitted service-account credential file).
 * Browser NEXT_PUBLIC_FIREBASE_* configuration is not an Admin credential.
 */
export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = firebaseAdminProjectIdFromEnvironment();
  const storageBucket = configured(process.env.RFXCHANGE_FIREBASE_STORAGE_BUCKET);

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    ...(storageBucket ? { storageBucket } : {}),
  });
}
