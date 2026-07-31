import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { projectPublicOrganizationMarker } from "@/src/domain/organization-markers/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { createFirestoreOrganizationLocationRepositories } from "@/src/infrastructure/firestore/organization-location";
import { createFirestoreOrganizationMarkerRepositories } from "@/src/infrastructure/firestore/organization-marker";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";

export async function GET() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind !== "authorized") {
    return NextResponse.json({ error: "Home scene is not available." }, { status: 403 });
  }

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const geographyRepositories = createFirestoreGeographyRepositories(db);
  const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
  const markerRepositories = createFirestoreOrganizationMarkerRepositories(db);
  const location = await locationRepositories.locations.getByOrganizationId(
    access.membership.organizationId,
  );
  if (!location) {
    return NextResponse.json({ error: "Confirmed organization location required." }, { status: 409 });
  }

  const [geography, activation, profile] = await Promise.all([
    geographyRepositories.definitions.getById(location.geographyId),
    markerRepositories.activations.getByOrganizationId(access.membership.organizationId),
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
  ]);
  if (!geography || activation?.status !== "active") {
    return NextResponse.json({ error: "Active organization marker required." }, { status: 409 });
  }

  const boundary = await new TigerWebBoundarySnapshotRepository(
    geographyRepositories.definitions,
  ).getByGeographyId(geography.id);
  if (!boundary) {
    return NextResponse.json({ error: "Authoritative locality boundary required." }, { status: 409 });
  }

  const marker = projectPublicOrganizationMarker({
    activation,
    location,
    geography,
    geographyGeometry: boundary.geometry,
  });

  return NextResponse.json({
    marker: {
      id: marker.id,
      coordinate: marker.coordinate,
      label: profile?.displayName ?? "Your organization",
      accessibleLocationLabel: marker.accessibleLocationLabel,
    },
    controlledPlatformUrl: access.state.controlledPlatformUrl ?? "/geography/canvas",
  });
}
