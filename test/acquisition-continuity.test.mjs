import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AcquisitionContextService } from "../src/application/acquisition/acquisition-context.ts";
import {
  AcquisitionContextBindingError,
  acquisitionIntent,
  bindAcquisitionContext,
  resumeAcquisitionContext,
} from "../src/domain/acquisition/model.ts";
import {
  createPublicOpportunityProjection,
} from "../src/domain/acquisition/public-opportunity.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import {
  createActivationJourneyContext,
  updateActivationJourneyContext,
} from "../src/domain/onboarding/model.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const START = "2026-08-01T12:00:00.000Z";

function fixture() {
  let now = START;
  let sequence = 0;
  const contexts = new Map();
  const events = [];
  const publicProjection = createPublicOpportunityProjection({
    reference: "public-opportunity",
    title: "Public capability search",
    issuerDisplayName: "Public issuer",
    summary: "An approved privacy-safe opportunity summary for acquisition acceptance testing.",
    capabilityCategories: ["Facilities and real estate"],
    localityLabel: "Portsmouth, Virginia",
    availabilityLabel: "Accepting capability introductions",
    publicationState: "published",
    visibility: "public",
    provenanceLabel: "Acceptance projection",
  });
  const restrictedProjection = createPublicOpportunityProjection({
    ...publicProjection,
    reference: "restricted-opportunity",
    publicationState: "restricted",
    visibility: "participant-only",
  });
  const repository = {
    async getById(id) {
      return contexts.get(id) ?? null;
    },
    async create(context, event) {
      if (contexts.has(context.id)) throw new Error("Duplicate context.");
      contexts.set(context.id, context);
      events.push(event);
    },
    async bind(input) {
      const current = contexts.get(input.id);
      if (!current) throw new Error("Acquisition context is unavailable.");
      const bound = bindAcquisitionContext({
        context: current,
        browserSecretDigest: input.browserSecretDigest,
        userId: input.userId,
        accessJourneyId: input.accessJourneyId,
        now: input.now,
      });
      if (current.status !== "bound") {
        events.push({ id: input.eventId, kind: "bound", acquisitionContextId: bound.id });
      }
      contexts.set(bound.id, bound);
      return bound;
    },
    async resume(input) {
      const current = contexts.get(input.id);
      if (!current) throw new Error("Acquisition context is unavailable.");
      const resumed = resumeAcquisitionContext({
        context: current,
        userId: input.userId,
        accessJourneyId: input.accessJourneyId,
        now: input.now,
      });
      if (current.status !== "resumed") {
        events.push({ id: input.eventId, kind: "resumed", acquisitionContextId: resumed.id });
      }
      contexts.set(resumed.id, resumed);
      return resumed;
    },
  };
  const service = new AcquisitionContextService({
    contexts: repository,
    opportunities: {
      async getByReference(reference) {
        if (reference === publicProjection.reference) return publicProjection;
        if (reference === restrictedProjection.reference) return restrictedProjection;
        return null;
      },
    },
    ids: {
      context: () => `context-${++sequence}`,
      event: () => `event-${++sequence}`,
    },
    secrets: {
      create: () => `${"s".repeat(40)}${sequence}`,
      digest: (value) => createHash("sha256").update(value).digest("hex"),
    },
    now: () => now,
  });
  return {
    contexts,
    events,
    service,
    setNow(value) { now = value; },
  };
}

function participant(id = "usr-acquisition") {
  return createUserIdentity({
    id,
    name: "Acquisition Participant",
    primaryEmail: `${id}@example.test`,
    loginProvider: "firebase",
    loginSubject: `firebase-${id}`,
    now: START,
  });
}

test("ACQ-002 emits only explicitly published public opportunity projections", async () => {
  const subject = fixture();
  const visible = await subject.service.publicOpportunity("public-opportunity");
  assert.equal(visible?.title, "Public capability search");
  assert.equal(Object.hasOwn(visible, "privateResponseInstructions"), false);
  assert.equal(await subject.service.publicOpportunity("restricted-opportunity"), null);
  assert.equal(await subject.service.publicOpportunity("missing"), null);

  const issued = await subject.service.issuePublicOpportunity({
    reference: "public-opportunity",
    referrer: "https://partner.example/path?private=value",
  });
  const stored = subject.contexts.get(issued.token.contextId);
  assert.equal(stored.intent.kind, "opportunity");
  assert.equal(stored.intent.subjectReference, "public-opportunity");
  assert.equal(stored.source.referrerHost, "partner.example");
  assert.equal(stored.source.sourceReference, "public-opportunity");
  assert.equal(stored.browserSecretDigest.includes(issued.token.browserSecret), false);
  await assert.rejects(
    subject.service.issuePublicOpportunity({ reference: "restricted-opportunity" }),
    /unavailable/i,
  );
});

test("ACQ-003 preserves every supported non-direct semantic context through one user journey", async () => {
  const subject = fixture();
  const user = participant();
  const journey = accessJourneyId("activation-usr-acquisition");
  const variants = [
    ["organization-claim", "organization-claim-link"],
    ["referral", "referral-link"],
    ["team-invitation", "team-invitation-link"],
    ["provider", "provider-link"],
    ["buyer-need", "buyer-link"],
  ];

  for (const [kind, channel] of variants) {
    const token = await subject.service.issueTrusted({
      kind,
      subjectReference: `${kind}-subject`,
      channel,
      sourceReference: `${kind}-source`,
    });
    const bound = await subject.service.bind({ token, userId: user.id, accessJourneyId: journey });
    assert.equal(bound.intent.kind, kind);
    assert.equal(bound.intent.subjectReference, `${kind}-subject`);
    assert.equal(bound.boundUserId, user.id);
    assert.equal(bound.boundAccessJourneyId, journey);

    const activation = createActivationJourneyContext({
      userId: user.id,
      provisionalOrganizationName: "Acquisition Test Organization",
      now: START,
    });
    const attached = updateActivationJourneyContext(activation, {
      acquisitionContext: bound,
      now: START,
    });
    assert.deepEqual(attached.acquisitionContext?.intent, bound.intent);
  }

  assert.deepEqual(acquisitionIntent({ kind: "direct" }), {
    kind: "direct",
    subjectReference: null,
  });
  const direct = createActivationJourneyContext({
    userId: user.id,
    provisionalOrganizationName: "Direct Registration Organization",
    now: START,
  });
  assert.equal(direct.acquisitionContext, null);
});

test("ACQ-003 denies tampering, expiry, cross-user replay, and cross-journey attachment", async () => {
  const subject = fixture();
  const firstUser = participant("usr-first");
  const secondUser = participant("usr-second");
  const firstJourney = accessJourneyId("activation-usr-first");
  const token = await subject.service.issueTrusted({
    kind: "referral",
    subjectReference: "referral-1",
    channel: "referral-link",
  });

  await assert.rejects(
    subject.service.bind({
      token: { ...token, browserSecret: `${token.browserSecret}tampered` },
      userId: firstUser.id,
      accessJourneyId: firstJourney,
    }),
    /binding is invalid/i,
  );

  const bound = await subject.service.bind({
    token,
    userId: firstUser.id,
    accessJourneyId: firstJourney,
  });
  const rebound = await subject.service.bind({
    token,
    userId: firstUser.id,
    accessJourneyId: firstJourney,
  });
  assert.deepEqual(rebound, bound, "same-user re-entry must be deterministic and idempotent");
  assert.equal(subject.events.filter((event) => event.kind === "bound").length, 1);
  const resumed = await subject.service.resume({
    contextId: bound.id,
    userId: firstUser.id,
    accessJourneyId: firstJourney,
  });
  assert.equal(resumed.resumeStatus, "resumed");
  await subject.service.resume({
    contextId: bound.id,
    userId: firstUser.id,
    accessJourneyId: firstJourney,
  });
  assert.equal(subject.events.filter((event) => event.kind === "resumed").length, 1);

  await assert.rejects(
    subject.service.bind({
      token,
      userId: secondUser.id,
      accessJourneyId: accessJourneyId("activation-usr-second"),
    }),
    (error) => error instanceof AcquisitionContextBindingError &&
      /another participant journey/i.test(error.message),
  );
  await assert.rejects(
    subject.service.resume({
      contextId: bound.id,
      userId: secondUser.id,
      accessJourneyId: accessJourneyId("activation-usr-second"),
    }),
    /cannot be resumed/i,
  );

  const activation = createActivationJourneyContext({
    userId: secondUser.id,
    provisionalOrganizationName: "Second Organization",
    now: START,
  });
  assert.throws(
    () => updateActivationJourneyContext(activation, { acquisitionContext: bound, now: START }),
    /another participant journey/i,
  );

  const firstActivation = createActivationJourneyContext({
    userId: firstUser.id,
    provisionalOrganizationName: "First Organization",
    now: START,
  });
  const withOrganization = updateActivationJourneyContext(firstActivation, {
    organizationId: organizationId("org-authoritative"),
    now: START,
  });
  const withOpaqueClaim = updateActivationJourneyContext(withOrganization, {
    acquisitionContext: bound,
    now: START,
  });
  assert.equal(withOpaqueClaim.organizationId, "org-authoritative");
  assert.equal(withOpaqueClaim.acquisitionContext?.intent.subjectReference, "referral-1");

  const staleSubject = fixture();
  const stale = await staleSubject.service.issueTrusted({
    kind: "buyer-need",
    subjectReference: "need-1",
    channel: "buyer-link",
  });
  staleSubject.setNow("2026-09-15T12:00:00.000Z");
  await assert.rejects(
    staleSubject.service.bind({
      token: stale,
      userId: firstUser.id,
      accessJourneyId: firstJourney,
    }),
    (error) => error instanceof AcquisitionContextBindingError && /expired/i.test(error.message),
  );

  const staleResumeSubject = fixture();
  const staleResumeToken = await staleResumeSubject.service.issueTrusted({
    kind: "team-invitation",
    subjectReference: "team-1",
    channel: "team-invitation-link",
  });
  const staleResumeBound = await staleResumeSubject.service.bind({
    token: staleResumeToken,
    userId: firstUser.id,
    accessJourneyId: firstJourney,
  });
  staleResumeSubject.setNow("2026-09-15T12:00:00.000Z");
  await assert.rejects(
    staleResumeSubject.service.resume({
      contextId: staleResumeBound.id,
      userId: firstUser.id,
      accessJourneyId: firstJourney,
    }),
    /expired/i,
  );
});

test("ACQ-002/003 UI and route boundaries remain responsive and server-authoritative", async () => {
  const [publicPage, publicCss, continuation, continuationCss, activation] = await Promise.all([
    readFile(new URL("../app/opportunities/[reference]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/opportunities/[reference]/page.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/acquisition/continue/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/acquisition/continue/page.module.css", import.meta.url), "utf8"),
    readFile(new URL("../src/application/onboarding/activation-journey.ts", import.meta.url), "utf8"),
  ]);
  assert.match(publicPage, /approved public projection/);
  assert.doesNotMatch(publicPage, /responseInstructions|evaluationCriteria|issuerEmail/);
  assert.match(publicCss, /@media \(max-width: 760px\)/);
  assert.match(publicCss, /grid-template-columns: 1fr/);
  assert.match(continuationCss, /@media \(max-width: 620px\)/);
  assert.match(continuationCss, /\.actions \{\s*display: grid;/);
  assert.match(continuation, /resolveParticipantRoute/);
  assert.match(continuation, /activation-required/);
  assert.match(continuation, /restricted/);
  assert.match(activation, /lifecycle\.state === "controlled-platform"/);
  assert.match(activation, /\/acquisition\/continue/);
});
