from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected one marker in {path}, found {count}: {old[:180]!r}"
        )
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


repository = Path("src/infrastructure/firestore/opportunity-discovery.ts")
replace_once(
    repository,
    'import { FieldPath, FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";\n',
    '''import { createHash } from "node:crypto";

import { FieldPath, FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
''',
)
replace_once(
    repository,
    '''function mergeDailyAlert(current: OpportunityAlertIntent, next: OpportunityAlertIntent): OpportunityAlertIntent {
  if (current.deliveryMode !== "daily-digest" || next.deliveryMode !== "daily-digest" || current.windowKey !== next.windowKey || current.status !== "queued" || current.request.metadata.idempotencyKey !== next.request.metadata.idempotencyKey) {
    throw new Error("Opportunity daily digest identity collision.");
  }
''',
    '''type PersistedOpportunityAlertIntent = Omit<OpportunityAlertIntent, "status"> & Readonly<{
  status: string;
  deliveryClaimId?: string | null;
}>;

function stableId(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256")
    .update(values.join(":"), "utf8")
    .digest("hex")
    .slice(0, 40)}`;
}

function alertFrozen(current: PersistedOpportunityAlertIntent): boolean {
  return (
    current.status !== "queued" ||
    Boolean(current.deliveryClaimId?.trim()) ||
    Number(current.attemptCount ?? 0) > 0
  );
}

function followUpDailyAlert(
  next: OpportunityAlertIntent,
  projection: ResponderOpportunityProjection,
): OpportunityAlertIntent {
  const followUpKey = stableId(
    "followup",
    projection.reference,
    String(projection.aggregateVersion),
    projection.digest,
  ).slice(-16);
  const windowKey = `${next.updatedAt.slice(0, 10)}:follow-up:${followUpKey}`;
  const alertId = stableId(
    "oppalert",
    String(next.organizationId),
    String(next.userId),
    windowKey,
  );
  return Object.freeze({
    ...next,
    id: alertId,
    windowKey,
    request: Object.freeze({
      ...next.request,
      id: alertId as OpportunityAlertIntent["request"]["id"],
      metadata: Object.freeze({
        ...next.request.metadata,
        correlationId: `opportunity-alert:${windowKey}` as OpportunityAlertIntent["request"]["metadata"]["correlationId"],
        idempotencyKey: `opportunity-alert:${alertId}` as OpportunityAlertIntent["request"]["metadata"]["idempotencyKey"],
        relatedObjectId: alertId,
      }),
    }),
  });
}

function mergeDailyAlert(current: PersistedOpportunityAlertIntent, next: OpportunityAlertIntent): OpportunityAlertIntent {
  if (current.deliveryMode !== "daily-digest" || next.deliveryMode !== "daily-digest" || current.windowKey !== next.windowKey || alertFrozen(current) || current.request.metadata.idempotencyKey !== next.request.metadata.idempotencyKey) {
    throw new Error("Opportunity daily digest identity collision.");
  }
''',
)
replace_once(
    repository,
    '''  return Object.freeze({
    ...current,
    matchEventIds: Object.freeze([...new Set([...current.matchEventIds, ...next.matchEventIds])]),
''',
    '''  return Object.freeze({
    ...current,
    status: "queued",
    matchEventIds: Object.freeze([...new Set([...current.matchEventIds, ...next.matchEventIds])]),
''',
)
replace_once(
    repository,
    '''    const alertRef = bundle.alert ? this.db.collection(ALERTS).doc(bundle.alert.id) : null;
''',
    '''    const baseAlertRef = bundle.alert ? this.db.collection(ALERTS).doc(bundle.alert.id) : null;
''',
)
replace_once(
    repository,
    '''      const refs = alertRef ? [matchRef, alertRef, savedSearchRef, projectionRef, membershipRef] : [matchRef, savedSearchRef, projectionRef, membershipRef];
''',
    '''      const refs = baseAlertRef ? [matchRef, baseAlertRef, savedSearchRef, projectionRef, membershipRef] : [matchRef, savedSearchRef, projectionRef, membershipRef];
''',
)
replace_once(
    repository,
    '''      const alertSnapshot = alertRef ? rest.shift() : null;
      const [savedSearchSnapshot, projectionSnapshot, membershipSnapshot] = rest;
      const currentAlert = alertSnapshot?.data() as OpportunityAlertIntent | undefined;
      if (alertSnapshot?.exists && (!currentAlert || bundle.alert?.deliveryMode !== "daily-digest")) throw new Error("Opportunity alert identity collision.");
''',
    '''      const baseAlertSnapshot = baseAlertRef ? rest.shift() : null;
      const [savedSearchSnapshot, projectionSnapshot, membershipSnapshot] = rest;
      const baseAlert = baseAlertSnapshot?.data() as PersistedOpportunityAlertIntent | undefined;
      if (baseAlertSnapshot?.exists && (!baseAlert || bundle.alert?.deliveryMode !== "daily-digest")) throw new Error("Opportunity alert identity collision.");
''',
)
replace_once(
    repository,
    '''      transaction.create(matchRef, immutable(bundle.match));
      if (alertRef && bundle.alert) {
        if (currentAlert) transaction.set(alertRef, mutable(mergeDailyAlert(currentAlert, bundle.alert)));
        else transaction.create(alertRef, mutable(bundle.alert));
      }
      return "created" as const;
''',
    '''      let targetAlert = bundle.alert;
      let targetAlertRef = baseAlertRef;
      let targetAlertSnapshot = baseAlertSnapshot;
      if (
        targetAlert &&
        baseAlertSnapshot?.exists &&
        baseAlert &&
        targetAlert.deliveryMode === "daily-digest" &&
        alertFrozen(baseAlert)
      ) {
        targetAlert = followUpDailyAlert(targetAlert, projection);
        targetAlertRef = this.db.collection(ALERTS).doc(targetAlert.id);
        targetAlertSnapshot = await transaction.get(targetAlertRef);
      }
      const targetCurrent = targetAlertSnapshot?.data() as PersistedOpportunityAlertIntent | undefined;

      transaction.create(matchRef, immutable(bundle.match));
      if (targetAlertRef && targetAlert) {
        if (targetAlertSnapshot?.exists) {
          if (!targetCurrent || targetAlert.deliveryMode !== "daily-digest") {
            throw new Error("Opportunity alert identity collision.");
          }
          if (alertFrozen(targetCurrent)) {
            const alreadyRepresented = targetAlert.opportunityReferences.every((reference) =>
              targetCurrent.opportunityReferences.includes(reference),
            );
            if (!alreadyRepresented) throw new Error("Opportunity alert identity collision.");
            return "created" as const;
          }
          transaction.set(targetAlertRef, mutable(mergeDailyAlert(targetCurrent, targetAlert)));
        } else {
          transaction.create(targetAlertRef, mutable(targetAlert));
        }
      }
      return "created" as const;
''',
)

contract = Path("test/pr204-alert-delivery-finalization.test.mjs")
replace_once(
    contract,
    '''test("claimed or delivered daily digests are frozen and late matches use a deterministic follow-up intent", async () => {
  const durable = await read(
    "functions/src/opportunity-discovery-evaluation-functions.ts",
  );
''',
    '''test("claimed or delivered daily digests are frozen and late matches use a deterministic follow-up intent", async () => {
  const [durable, synchronousRepository] = await Promise.all([
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("src/infrastructure/firestore/opportunity-discovery.ts"),
  ]);
''',
)
replace_once(
    contract,
    '''  assert.match(
    durable,
    /if \(frozen\) \{[\s\S]{0,100}if \(referenceAlreadyPresent\) return/,
  );
});
''',
    '''  assert.match(
    durable,
    /if \(frozen\) \{[\s\S]{0,100}if \(referenceAlreadyPresent\) return/,
  );

  assert.match(synchronousRepository, /function alertFrozen/);
  assert.match(synchronousRepository, /current\.status !== "queued"/);
  assert.match(synchronousRepository, /current\.deliveryClaimId/);
  assert.match(synchronousRepository, /Number\(current\.attemptCount \?\? 0\) > 0/);
  assert.match(synchronousRepository, /function followUpDailyAlert/);
  assert.match(synchronousRepository, /projection\.aggregateVersion/);
  assert.match(synchronousRepository, /projection\.digest/);
  assert.match(
    synchronousRepository,
    /baseAlertSnapshot\?\.exists[\s\S]{0,220}alertFrozen\(baseAlert\)[\s\S]{0,300}transaction\.get\(targetAlertRef\)/,
  );
  assert.match(
    synchronousRepository,
    /if \(alertFrozen\(targetCurrent\)\) \{[\s\S]{0,240}alreadyRepresented[\s\S]{0,160}return "created" as const/,
  );
  assert.match(
    synchronousRepository,
    /function mergeDailyAlert[\s\S]{0,360}alertFrozen\(current\)/,
  );
});
''',
)
