import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ControlledLocalityMapService } from "@/src/application/geography/controlled-locality-map";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";

export async function GET() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    return NextResponse.json({ error: "Authenticated activation required." }, { status: 401 });
  }
  if (access.kind === "restricted") {
    return NextResponse.json({ error: "Spatial activation is restricted." }, { status: 403 });
  }

  const selectedGeography = access.state?.selectedGeography;
  if (!selectedGeography) {
    return NextResponse.json({ error: "Home locality has not been selected." }, { status: 409 });
  }

  const repositories = createFirestoreGeographyRepositories(getServerFirestore());
  const selection = await repositories.selections.getByUserId(access.context.user.id);
  if (!selection || String(selection.geographyId) !== selectedGeography.id) {
    return NextResponse.json({ error: "Authoritative geography selection is unavailable." }, { status: 409 });
  }

  const model = await new ControlledLocalityMapService(
    repositories.definitions,
    new TigerWebBoundarySnapshotRepository(repositories.definitions),
  ).create(selection);

  return NextResponse.json({ model });
}
