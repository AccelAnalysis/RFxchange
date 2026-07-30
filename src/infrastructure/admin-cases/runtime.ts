import {
  AdministrativeCaseService,
  AdministrativeCaseWorkQueueProvider,
} from "../../application/admin/administrative-case-service.ts";
import {
  FirestoreAdministrativeCaseLifecycleUnitOfWork,
  FirestoreAdministrativeCaseRepository,
} from "../firestore/administrative-case-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerAdministrativeCaseRuntime() {
  const db = getServerFirestore();
  const cases = new FirestoreAdministrativeCaseRepository(db);
  return Object.freeze({
    cases,
    service: new AdministrativeCaseService({
      cases,
      lifecycle: new FirestoreAdministrativeCaseLifecycleUnitOfWork(db),
    }),
    workQueueProvider: new AdministrativeCaseWorkQueueProvider(cases),
  });
}
