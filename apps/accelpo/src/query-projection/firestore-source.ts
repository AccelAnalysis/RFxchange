import {
  FieldPath,
  Timestamp,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";

import type {
  ProjectionFilter,
  ProjectionPage,
  ProjectionRecord,
  ProjectionSource,
  ProjectionSourceQuery,
} from "./contracts.ts";

type CursorValue = Readonly<{
  kind: "string" | "number" | "boolean" | "timestamp";
  value: string | number | boolean;
}>;

interface ProjectionCursor {
  readonly sort: CursorValue;
  readonly id: string;
}

function cursorValue(value: unknown): CursorValue | null {
  if (value instanceof Timestamp) {
    return Object.freeze({ kind: "timestamp" as const, value: value.toMillis() });
  }
  if (typeof value === "string") return Object.freeze({ kind: "string" as const, value });
  if (typeof value === "number" && Number.isFinite(value)) {
    return Object.freeze({ kind: "number" as const, value });
  }
  if (typeof value === "boolean") return Object.freeze({ kind: "boolean" as const, value });
  return null;
}

function encodeCursor(record: ProjectionRecord, sortField: string): string | null {
  const sort = cursorValue(record.data[sortField]);
  if (!sort) return null;
  const payload: ProjectionCursor = Object.freeze({ sort, id: record.id });
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(value: string | null): ProjectionCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<ProjectionCursor>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string" || !parsed.id || parsed.id.length > 200) return null;
    const sort = parsed.sort;
    if (!sort || typeof sort !== "object") return null;
    if (
      !["string", "number", "boolean", "timestamp"].includes(sort.kind as string) ||
      !["string", "number", "boolean"].includes(typeof sort.value)
    ) return null;
    return Object.freeze({
      id: parsed.id,
      sort: Object.freeze({
        kind: sort.kind as CursorValue["kind"],
        value: sort.value as CursorValue["value"],
      }),
    });
  } catch {
    return null;
  }
}

function firestoreCursorValue(value: CursorValue): string | number | boolean | Timestamp {
  return value.kind === "timestamp" ? Timestamp.fromMillis(value.value as number) : value.value;
}

function applyFilter(query: Query, filter: ProjectionFilter): Query {
  return query.where(
    filter.field,
    filter.operator,
    filter.value as string | number | boolean | readonly (string | number | boolean)[],
  );
}

/**
 * Firestore adapter for CP-04. Every query starts with the organization equality constraint and
 * uses a stable value/document-ID ordering for cursor pagination. Raw documents never leave this
 * adapter except as server-held ProjectionRecord values passed to QueryProjectionService.
 */
export class FirestoreQueryProjectionSource implements ProjectionSource {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getOne(input: Readonly<{
    collection: ProjectionSourceQuery["collection"];
    organizationId: string;
    recordId: string;
  }>): Promise<ProjectionRecord | null> {
    const snapshot = await this.db.collection(input.collection).doc(input.recordId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() ?? {};
    if (data.organizationId !== input.organizationId) return null;
    return Object.freeze({
      id: snapshot.id,
      organizationId: input.organizationId,
      data: Object.freeze(data as Record<string, unknown>),
    });
  }

  async list(input: ProjectionSourceQuery): Promise<ProjectionPage<ProjectionRecord>> {
    let query: Query = this.db
      .collection(input.collection)
      .where("organizationId", "==", input.organizationId);

    for (const filter of input.filters) query = applyFilter(query, filter);

    query = query.orderBy(input.sortField).orderBy(FieldPath.documentId());
    const cursor = decodeCursor(input.cursor);
    if (input.cursor && !cursor) throw new Error("Projection cursor is invalid.");
    if (cursor) {
      query = query.startAfter(
        firestoreCursorValue(cursor.sort),
        cursor.id,
      );
    }

    const snapshot = await query.limit(input.limit + 1).get();
    const hasMore = snapshot.docs.length > input.limit;
    const documents = snapshot.docs.slice(0, input.limit);
    const records = Object.freeze(documents.flatMap((document) => {
      const data = document.data();
      return data.organizationId === input.organizationId
        ? [Object.freeze({
            id: document.id,
            organizationId: input.organizationId,
            data: Object.freeze(data as Record<string, unknown>),
          })]
        : [];
    }));
    const last = records.at(-1);

    return Object.freeze({
      records,
      nextCursor: hasMore && last ? encodeCursor(last, input.sortField) : null,
    });
  }
}
