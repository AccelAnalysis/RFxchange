import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ControlledLocalityMapService } from "@/src/application/geography/controlled-locality-map";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { ServerTimingCollector } from "@/src/infrastructure/observability/server-timing";

export async function GET(request: NextRequest) {
  const timing = new ServerTimingCollector();
  try {
    const cookieStore = await cookies();
    const access = await timing.measure(
      "auth",
      () => resolveParticipantRoute({
        sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
      }),
      "participant route resolution",
    );

    if (access.kind === "unauthenticated") {
      return timing.apply(NextResponse.json({ error: "Authenticated activation required.", code: "authentication-required" }, { status: 401 }));
    }
    if (access.kind === "access-resolution-required") {
      return timing.apply(NextResponse.json({ error: "Resolve current organization access before loading spatial activation.", code: "access-resolution-required" }, { status: 409 }));
    }
    if (access.kind === "wrong-organization") {
      return timing.apply(NextResponse.json({ error: "Spatial activation is unavailable for the requested organization.", code: "wrong-organization" }, { status: 403 }));
    }
    if (access.kind === "restricted") {
      return timing.apply(NextResponse.json({ error: "Spatial activation is restricted.", code: "access-restricted" }, { status: 403 }));
    }

    const repositories = createFirestoreGeographyRepositories(getServerFirestore());
    const selection = await timing.measure(
      "firestore-selection",
      () => repositories.selections.getByUserId(access.context.user.id),
      "authoritative home locality selection",
    );
    if (!selection) {
      return timing.apply(NextResponse.json({ error: "Home locality has not been selected." }, { status: 409 }));
    }

    const model = await timing.measure(
      "map-model",
      () => new ControlledLocalityMapService(
        repositories.definitions,
        new TigerWebBoundarySnapshotRepository(repositories.definitions),
      ).create(selection),
      "controlled locality map projection",
    );

    return timing.apply(NextResponse.json({ model }));
  } catch (error) {
    return timing.apply(apiProblem(request, {
      status: 500,
      participantMessage: "The spatial activation model is temporarily unavailable. Retry the request.",
      code: "dependency-unavailable",
      cause: error,
    }));
  }
}
