import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { projectPublicOrganizationMarker } from "@/src/domain/organization-markers/model";
import {
  appendFoundingAcquisitionIntent,
  RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME,
  RFXCHANGE_FOUNDING_ACQUISITION_INTENT,
} from "@/src/infrastructure/acquisition/founding-intent";
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
import { ServerTimingCollector } from "@/src/infrastructure/observability/server-timing";

export async function GET() {
  const timing = new ServerTimingCollector();
  const cookieStore = await cookies();
  const access = await timing.measure(
    "auth",
    () => resolveParticipantRoute({
      sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    }),
    "participant route resolution",
  );

  if (access.kind !== "authorized") {
    return timing.apply(NextResponse.json({ error: "Home scene is not available." }, { status: 403 }));
  }

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const geographyRepositories = createFirestoreGeographyRepositories(db);
  const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
  const markerRepositories = createFirestoreOrganizationMarkerRepositories(db);
  const location = await timing.measure(
    "firestore-location",
    () => locationRepositories.locations.getByOrganizationId(access.membership.organizationId),
    "confirmed organization location",
  );
  if (!location) {
    return timing.apply(NextResponse.json({ error: "Confirmed organization location required." }, { status: 409 }));
  }

  const [geography, activation, profile] = await timing.measure(
    "firestore-home-scene",
    () => Promise.all([
      geographyRepositories.definitions.getById(location.geographyId),
      markerRepositories.activations.getByOrganizationId(access.membership.organizationId),
      foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
    ]),
    "geography + marker + profile",
  );
  if (!geography || activation?.status !== "active") {
    return timing.apply(NextResponse.json({ error: "Active organization marker required." }, { status: 409 }));
  }

  const boundary = await timing.measure(
    "map-model",
    () => new TigerWebBoundarySnapshotRepository(
      geographyRepositories.definitions,
    ).getByGeographyId(geography.id),
    "home-scene locality boundary",
  );
  if (!boundary) {
    return timing.apply(NextResponse.json({ error: "Authoritative locality boundary required." }, { status: 409 }));
  }

  const marker = projectPublicOrganizationMarker({
    activation,
    location,
    geography,
    geographyGeometry: boundary.geometry,
  });
  const hasFoundingIntent = cookieStore.get(
    RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME,
  )?.value === RFXCHANGE_FOUNDING_ACQUISITION_INTENT;
  const controlledPlatformUrl = access.state.controlledPlatformUrl ?? "/geography/canvas";
  const response = NextResponse.json({
    marker: {
      id: marker.id,
      coordinate: marker.coordinate,
      label: profile?.displayName ?? "Your organization",
      accessibleLocationLabel: marker.accessibleLocationLabel,
    },
    controlledPlatformUrl: hasFoundingIntent
      ? appendFoundingAcquisitionIntent(controlledPlatformUrl)
      : controlledPlatformUrl,
  });

  if (hasFoundingIntent) {
    response.cookies.delete(RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME);
  }
  return timing.apply(response);
}
