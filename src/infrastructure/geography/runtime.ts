import type { Firestore } from "firebase-admin/firestore";

import { PrimaryOperatingGeographyService } from "../../application/geography/primary-operating-geography.ts";
import { ControlledLocalityMapService } from "../../application/geography/controlled-locality-map.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { TigerWebBoundarySnapshotRepository } from "./tigerweb-boundary-snapshot.ts";

export function createServerPrimaryOperatingGeographyService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): PrimaryOperatingGeographyService {
  const geography = createFirestoreGeographyRepositories(db);
  const foundation = createFirestoreFoundationRepositories(db);
  return new PrimaryOperatingGeographyService({
    definitions: geography.definitions,
    selections: geography.selections,
    authorizations: geography.authorizations,
    lifecycle: foundation.lifecycle.lifecycle,
    unitOfWork: geography.selectionUnitOfWork,
    now,
  });
}

export function createServerControlledLocalityMapService(
  db: Firestore = getServerFirestore(),
): ControlledLocalityMapService {
  const geography = createFirestoreGeographyRepositories(db);
  return new ControlledLocalityMapService(
    geography.definitions,
    new TigerWebBoundarySnapshotRepository(geography.definitions),
  );
}
