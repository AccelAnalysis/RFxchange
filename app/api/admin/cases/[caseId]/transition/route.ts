import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AdministrativeCaseService } from "@/src/application/admin/administrative-case-service";
import {
  administrativeCaseId,
  nextAdministrativeCaseStatus,
} from "@/src/domain/admin-cases/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  FirestoreAdministrativeCaseLifecycleUnitOfWork,
  FirestoreAdministrativeCaseRepository,
} from "@/src/infrastructure/firestore/administrative-case-repository";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16_000;

export async function POST(
  request: NextRequest,
  context: Readonly<{ params: Promise<Readonly<{ caseId: string }>> }>,
) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Case update request is too large." }, { status: 413 });
  }

  try {
    const { caseId: rawCaseId } = await context.params;
    const caseId = administrativeCaseId(decodeURIComponent(rawCaseId));
    const db = getServerFirestore();
    const cases = new FirestoreAdministrativeCaseRepository(db);
    const caseRecord = await cases.getById(caseId);
    if (!caseRecord) {
      return NextResponse.json({ error: "The requested administrative case is unavailable." }, { status: 404 });
    }

    const cookieStore = await cookies();
    const access = await resolveAdminRoute({
      sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
      permission: String(caseRecord.actionPermission),
      scope: `CASE:${String(caseRecord.id)}`,
      access: "write",
    });
    if (access.kind !== "authorized") {
      return NextResponse.json(
        { error: "This administrative case action is unavailable." },
        { status: access.kind === "unauthenticated" ? 401 : 403 },
      );
    }

    const body = await request.json() as Readonly<Record<string, unknown>>;
    const expectedStatus = String(body.expectedStatus ?? "").trim();
    const requestedNextStatus = String(body.nextStatus ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    if (!reason || reason.length > 1000) {
      return NextResponse.json({ error: "A concise case transition reason is required." }, { status: 400 });
    }
    if (expectedStatus !== caseRecord.status) {
      return NextResponse.json(
        { error: "The case changed before this action was submitted. Refresh and review the current state." },
        { status: 409 },
      );
    }
    const nextStatus = nextAdministrativeCaseStatus(caseRecord.status);
    if (!nextStatus || requestedNextStatus !== nextStatus) {
      return NextResponse.json({ error: "The requested case transition is not available." }, { status: 409 });
    }

    const service = new AdministrativeCaseService({
      cases,
      lifecycle: new FirestoreAdministrativeCaseLifecycleUnitOfWork(db),
    });
    const updated = await service.transition({
      authority: access.authority,
      caseRecord,
      eventId: randomUUID(),
      nextStatus,
      assignedAdministratorId: nextStatus === "assigned"
        ? String(access.account.administratorId)
        : undefined,
      reason,
      now: new Date().toISOString(),
    });

    return NextResponse.json({
      caseId: String(updated.id),
      caseNumber: String(updated.caseNumber),
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    const conflict = error instanceof Error && /changed|transition|already exists/i.test(error.message);
    return apiProblem(request, {
      status: conflict ? 409 : 500,
      participantMessage: conflict
        ? "The case changed before this action could be completed. Refresh and review the current state."
        : "The case could not be updated.",
      code: conflict ? "case-state-conflict" : "dependency-unavailable",
      cause: error,
    });
  }
}
