import {
  FieldValue,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

import type { OrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  ConfirmedOrganizationLocation,
  OrganizationLocationDraft,
  OrganizationLocationDraftId,
  OrganizationLocationEvent,
  OrganizationServiceGeography,
} from "../../domain/organization-location/model.ts";
import type {
  ConfirmedOrganizationLocationRepository,
  OrganizationLocationDraftRepository,
  OrganizationLocationRepositories,
  OrganizationLocationUnitOfWork,
  OrganizationServiceGeographyRepository,
} from "../../domain/organization-location/repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreDocumentPath,
} from "./schema.ts";
import { getFirestoreRecordById } from "./support.ts";

function appendOnly(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function mutableCreate(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function mutableUpdate(record: object, createdAt: unknown): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function eventReference(db: Firestore, event: OrganizationLocationEvent) {
  return db.doc(firestoreDocumentPath("organizationLocationEvents", event.id));
}

function auditReference(db: Firestore, event: OrganizationActionAuditEvent) {
  return db.doc(firestoreDocumentPath("organizationAuditEvents", event.id));
}

export class FirestoreOrganizationLocationDraftRepository
  implements OrganizationLocationDraftRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getById(id: OrganizationLocationDraftId): Promise<OrganizationLocationDraft | null> {
    return getFirestoreRecordById<OrganizationLocationDraft>(
      this.db,
      "organizationLocationDrafts",
      id,
    );
  }

  async save(
    draft: OrganizationLocationDraft,
    event: OrganizationLocationEvent,
  ): Promise<void> {
    const draftRef = this.db.doc(
      firestoreDocumentPath("organizationLocationDrafts", draft.id),
    );
    const eventRef = eventReference(this.db, event);
    await this.db.runTransaction(async (transaction) => {
      const [draftSnapshot, eventSnapshot] = await Promise.all([
        transaction.get(draftRef),
        transaction.get(eventRef),
      ]);
      if (draftSnapshot.exists || eventSnapshot.exists) {
        throw new Error("Organization location draft or event identity already exists.");
      }
      transaction.create(draftRef, mutableCreate(draft));
      transaction.create(eventRef, appendOnly(event));
    });
  }
}

export class FirestoreConfirmedOrganizationLocationRepository
  implements ConfirmedOrganizationLocationRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<ConfirmedOrganizationLocation | null> {
    return getFirestoreRecordById<ConfirmedOrganizationLocation>(
      this.db,
      "organizationLocations",
      organizationId,
    );
  }
}

export class FirestoreOrganizationServiceGeographyRepository
  implements OrganizationServiceGeographyRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationServiceGeography | null> {
    return getFirestoreRecordById<OrganizationServiceGeography>(
      this.db,
      "organizationServiceGeographies",
      organizationId,
    );
  }
}

export class FirestoreOrganizationLocationUnitOfWork
  implements OrganizationLocationUnitOfWork {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async confirm(input: Parameters<OrganizationLocationUnitOfWork["confirm"]>[0]): Promise<void> {
    const draftRef = this.db.doc(
      firestoreDocumentPath("organizationLocationDrafts", input.draft.id),
    );
    const locationRef = this.db.doc(
      firestoreDocumentPath("organizationLocations", input.location.id),
    );
    const eventRef = eventReference(this.db, input.event);
    const auditRef = auditReference(this.db, input.auditEvent);
    await this.db.runTransaction(async (transaction) => {
      const [draftSnapshot, locationSnapshot, eventSnapshot, auditSnapshot] =
        await Promise.all([
          transaction.get(draftRef),
          transaction.get(locationRef),
          transaction.get(eventRef),
          transaction.get(auditRef),
        ]);
      if (
        !draftSnapshot.exists ||
        draftSnapshot.data()?.state !== "geocoded" ||
        input.draft.state !== "confirmed"
      ) {
        throw new Error("Organization location draft changed before confirmation.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new Error("Organization location confirmation evidence already exists.");
      }
      transaction.set(
        draftRef,
        mutableUpdate(input.draft, draftSnapshot.data()?.createdAt),
      );
      transaction.set(
        locationRef,
        locationSnapshot.exists
          ? mutableUpdate(input.location, locationSnapshot.data()?.createdAt)
          : mutableCreate(input.location),
      );
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(auditRef, appendOnly(input.auditEvent));
    });
  }

  async changeVisibility(
    input: Parameters<OrganizationLocationUnitOfWork["changeVisibility"]>[0],
  ): Promise<void> {
    const locationRef = this.db.doc(
      firestoreDocumentPath("organizationLocations", input.location.id),
    );
    const eventRef = eventReference(this.db, input.event);
    const auditRef = auditReference(this.db, input.auditEvent);
    await this.db.runTransaction(async (transaction) => {
      const [locationSnapshot, eventSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(locationRef),
        transaction.get(eventRef),
        transaction.get(auditRef),
      ]);
      if (!locationSnapshot.exists) {
        throw new Error("Confirmed organization location no longer exists.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new Error("Organization location visibility evidence already exists.");
      }
      transaction.set(
        locationRef,
        mutableUpdate(input.location, locationSnapshot.data()?.createdAt),
      );
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(auditRef, appendOnly(input.auditEvent));
    });
  }

  async saveServiceGeographies(
    input: Parameters<OrganizationLocationUnitOfWork["saveServiceGeographies"]>[0],
  ): Promise<void> {
    const recordRef = this.db.doc(
      firestoreDocumentPath(
        "organizationServiceGeographies",
        input.serviceGeographies.id,
      ),
    );
    const eventRef = eventReference(this.db, input.event);
    const auditRef = auditReference(this.db, input.auditEvent);
    await this.db.runTransaction(async (transaction) => {
      const [recordSnapshot, eventSnapshot, auditSnapshot] = await Promise.all([
        transaction.get(recordRef),
        transaction.get(eventRef),
        transaction.get(auditRef),
      ]);
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new Error("Organization service-geography evidence already exists.");
      }
      transaction.set(
        recordRef,
        recordSnapshot.exists
          ? mutableUpdate(
              input.serviceGeographies,
              recordSnapshot.data()?.createdAt,
            )
          : mutableCreate(input.serviceGeographies),
      );
      transaction.create(eventRef, appendOnly(input.event));
      transaction.create(auditRef, appendOnly(input.auditEvent));
    });
  }
}

export function createFirestoreOrganizationLocationRepositories(
  db: Firestore,
): OrganizationLocationRepositories {
  return Object.freeze({
    drafts: new FirestoreOrganizationLocationDraftRepository(db),
    locations: new FirestoreConfirmedOrganizationLocationRepository(db),
    serviceGeographies: new FirestoreOrganizationServiceGeographyRepository(db),
    unitOfWork: new FirestoreOrganizationLocationUnitOfWork(db),
  });
}
