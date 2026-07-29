import {
  createFunctionsRuntimeContext,
  type FunctionsRuntimeContext,
} from "../application/runtime-foundation.js";

export const RFXCHANGE_FUNCTIONS_REGION = "us-east1" as const;

interface FirebaseRuntimeConfig {
  readonly projectId?: unknown;
}

function projectIdFromFirebaseConfig(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  try {
    const parsed = JSON.parse(normalized) as FirebaseRuntimeConfig;
    return typeof parsed.projectId === "string" && parsed.projectId.trim()
      ? parsed.projectId.trim()
      : null;
  } catch {
    throw new Error("FIREBASE_CONFIG must contain valid JSON when supplied.");
  }
}

function currentProjectId(environment: NodeJS.ProcessEnv): string {
  const direct = environment.GCLOUD_PROJECT?.trim();
  const configured = projectIdFromFirebaseConfig(environment.FIREBASE_CONFIG);
  const projectId = direct || configured;
  if (!projectId) throw new Error("Cloud Functions runtime could not determine the Firebase project id.");
  return projectId;
}

export function functionsRuntimeContextFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): FunctionsRuntimeContext {
  const emulator = environment.FUNCTIONS_EMULATOR === "true";
  const role = environment.RFXCHANGE_ENV?.trim() || (emulator ? "development" : "");
  if (!role) {
    throw new Error("RFXCHANGE_ENV is required outside the Firebase Functions emulator.");
  }

  const projectId = currentProjectId(environment);
  const expectedProjectId = environment.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();
  if (expectedProjectId && expectedProjectId !== projectId) {
    throw new Error(
      `Firebase project mismatch: expected ${expectedProjectId}, received ${projectId}.`,
    );
  }

  return createFunctionsRuntimeContext({
    environment: role,
    projectId,
    emulator,
    region: RFXCHANGE_FUNCTIONS_REGION,
  });
}
