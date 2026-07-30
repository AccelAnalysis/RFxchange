import {
  FieldValue,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OrganizationMarkerActivation,
} from "../../domain/organization-markers/model.ts";
import type {
  OrganizationMarkerActivationRepository,
  OrganizationMarkerActivationUnitOfWork,
  OrganizationMarkerRepositories,
} from "../../domain/organization-markers/repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreDocumentPath,
} from "./schema.ts";
import { getFirestoreRecordById } from "./support.ts";

function mutable(record: object, createdAt: unknown): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function appendOnly(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

export class FirestoreOrganizationMarkerActivationRepository
  implements OrganizationMarkerActivationRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationMarkerActivation | null> {
    return getFirestoreRecordById<OrganizationMarkerActivation>(
      this.db,
      "organizationMarkerActivations",
      organizationId,
    );
  }
}

export class FirestoreOrganizationMarkerActivationUnitOfWork
  implements OrganizationMarkerActivationUnitOfWork {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async save(
    input: Parameters<OrganizationMarkerActivationUnitOfWork["save"]>[0],
  ): Promise<void> {
    const activationRef = this.db.doc(
      firestoreDocumentPath(
        "organizationMarkerActivations",
        input.activation.id,
      ),
    );
    const eventRef = input.event
      ? this.db.doc(
          firestoreDocumentPath("organizationMarkerEvents", input.event.id),
        )
      : null;
    const auditRef = input.auditEvent
      ? this.db.doc(
          firestoreDocumentPath(
            "organizationAuditEvents",
            input.auditEvent.id,
          ),
        )
      : null;

    await this.db.runTransaction(async (transaction) => {
      const [activationSnapshot, eventSnapshot, auditSnapshot] =
        await Promise.all([
          transaction.get(activationRef),
          eventRef ? transaction.get(eventRef) : Promise.resolve(null),
          auditRef ? transaction.get(auditRef) : Promise.resolve(null),
        ]);
      if (
        input.event &&
        input.auditEvent &&
        eventSnapshot?.exists &&
        auditSnapshot?.exists
      ) {
        const current = activationSnapshot.data() as
          | OrganizationMarkerActivation
          | undefined;
        if (
          current?.organizationId === input.activation.organizationId &&
          current.status === input.activation.status &&
          current.firstActivatedAt === input.activation.firstActivatedAt
        ) {
          return;
        }
        throw new Error("Marker idempotency evidence conflicts with current state.");
      }
      if (eventSnapshot?.exists || auditSnapshot?.exists) {
        throw new Error("Marker transition event identities are only partially committed.");
      }
      if (
        input.event &&
        (input.event.organizationId !== input.activation.organizationId ||
          input.event.geographyId !== input.activation.geographyId)
      ) {
        throw new Error("Marker event belongs to a different organization/geography scope.");
      }
      if (
        input.auditEvent &&
        input.auditEvent.organizationId !== input.activation.organizationId
      ) {
        throw new Error("Marker audit event belongs to a different organization scope.");
      }

      transaction.set(
        activationRef,
        mutable(
          input.activation,
          activationSnapshot.exists
            ? activationSnapshot.data()?.createdAt
            : FieldValue.serverTimestamp(),
        ),
      );
      if (eventRef && input.event) {
        transaction.create(eventRef, appendOnly(input.event));
      }
      if (auditRef && input.auditEvent) {
        transaction.create(auditRef, appendOnly(input.auditEvent));
      }
    });
  }
}

export function createFirestoreOrganizationMarkerRepositories(
  db: Firestore,
): OrganizationMarkerRepositories {
  return Object.freeze({
    activations: new FirestoreOrganizationMarkerActivationRepository(db),
    unitOfWork: new FirestoreOrganizationMarkerActivationUnitOfWork(db),
  });
}
