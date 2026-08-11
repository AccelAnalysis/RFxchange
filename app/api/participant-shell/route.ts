import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hydrateEssentialOrganizationProfile } from "@/src/domain/organization-profile/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";

const NO_STORE_HEADERS = Object.freeze({
  "cache-control": "private, no-store, max-age=0",
});

function emptyShellContext() {
  return NextResponse.json(
    { organization: null },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

/**
 * Optional identity projection for the already-rendered participant shell.
 *
 * Participant pages remain the authoritative protected-route boundary. This endpoint fails closed
 * and never blocks the shell or grants navigation authority; it only supplies a permitted identity
 * label after the persistent shell is visible.
 */
export async function GET() {
  try {
    const sessionCookie = (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
    const access = await resolveParticipantRoute({ sessionCookie });
    if (access.kind !== "authorized") return emptyShellContext();

    const organizationId = String(access.membership.organizationId);
    const profileRecord = await createServerFirestoreFoundationRepositories(
      getServerFirestore(),
    ).organizations.profiles.getByOrganizationId(access.membership.organizationId);
    const organizationName = profileRecord
      ? hydrateEssentialOrganizationProfile(profileRecord).displayName
      : null;

    return NextResponse.json(
      {
        organization: {
          id: organizationId,
          name: organizationName,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch {
    return emptyShellContext();
  }
}
