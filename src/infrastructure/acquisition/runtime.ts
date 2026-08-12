import { createHash, randomBytes, randomUUID } from "node:crypto";

import { AcquisitionContextService } from "../../application/acquisition/acquisition-context.ts";
import { FirestoreAcquisitionContextRepository } from "../firestore/acquisition-context.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { resolveParticipantRoute } from "../auth/participant-route-runtime.ts";
import { FirestorePublishedOpportunityRepository } from "./firestore-published-opportunities.ts";

export const RFXCHANGE_ACQUISITION_COOKIE_NAME = "rfx_acquisition_context";

export function acquisitionCookieOptions() {
  return Object.freeze({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function createServerAcquisitionContextService(): AcquisitionContextService {
  const db = getServerFirestore();
  return new AcquisitionContextService({
    contexts: new FirestoreAcquisitionContextRepository(db),
    opportunities: new FirestorePublishedOpportunityRepository(db),
    ids: {
      context: () => `acq-${randomUUID()}`,
      event: () => `acq-event-${randomUUID()}`,
    },
    secrets: {
      create: () => randomBytes(32).toString("base64url"),
      digest: (value) => createHash("sha256").update(value, "utf8").digest("hex"),
    },
    now: () => new Date().toISOString(),
  });
}

export async function resolvePublicOpportunityProjection(
  reference: string,
  participantAuthorized = false,
) {
  return new FirestorePublishedOpportunityRepository(
    getServerFirestore(),
  ).getResponderProjection(reference, participantAuthorized);
}

export async function resolveOptionalOpportunityParticipant(
  sessionCookie: string | null | undefined,
): Promise<boolean> {
  const access = await resolveParticipantRoute({ sessionCookie });
  return access.kind === "authorized" && access.state.lifecycleState === "open-platform";
}
