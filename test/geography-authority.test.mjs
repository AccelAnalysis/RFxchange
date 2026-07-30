import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  GeographySelectionError,
  PrimaryOperatingGeographyService,
} from "../src/application/geography/primary-operating-geography.ts";
import {
  createGeographyDefinition,
  createGeographyParticipationAuthorization,
  resolveGeographyCameraPlan,
} from "../src/domain/geography/model.ts";
import { evaluateGeographyParticipation } from "../src/domain/geography/policy.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const now = "2026-07-30T14:00:00.000Z";

function userFixture(id = "usr_geography") {
  const user = createUserIdentity({
    id,
    name: "Geography User",
    primaryEmail: `${id}@example.test`,
    loginProvider: "firebase",
    loginSubject: `firebase-${id}`,
    now,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: `firebase-${id}`,
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: now,
      issuedAt: now,
      expiresAt: "2026-07-30T15:00:00.000Z",
    },
    source: "session-cookie",
  });
  return { user, context };
}

function activatedJourney(user, id = "journey-geography") {
  let journey = createAccessLifecycle({ id, now });
  journey = advanceAccessLifecycle(journey, "account-started", "2026-07-30T14:01:00.000Z");
  journey = advanceAccessLifecycle(journey, "account-activated", "2026-07-30T14:02:00.000Z");
  return associateAccessJourneyWithUser(journey, user.id, "2026-07-30T14:03:00.000Z");
}

function geography(releaseState, options = {}) {
  return createGeographyDefinition({
    id: options.id ?? `us-va-${releaseState}`,
    countryCode: "US",
    fipsCode: options.fipsCode ?? "51740",
    name: options.name ?? "Portsmouth",
    type: "independent-city",
    boundary: {
      authority: "United States Census Bureau",
      dataset: "TIGER/Line Places",
      vintage: "2025",
      sourceFeatureId: options.fipsCode ?? "51740",
    },
    releaseState,
    limitedParticipationActivities: options.limitedParticipationActivities,
    parentGeographyId: "us-va",
    adjacentGeographyIds: ["us-va-norfolk", "us-va-suffolk"],
    bounds: { west: -76.42, south: 36.73, east: -76.21, north: 36.91 },
    defaultCamera: {
      center: { longitude: -76.31, latitude: 36.84 },
      pitchDegrees: 42,
      bearingDegrees: -12,
      paddingPixels: 48,
      maximumZoom: 13,
    },
    now,
  });
}

function memoryService({ user, journey, definitions, authorizations = [] }) {
  const definitionMap = new Map(definitions.map((value) => [value.id, value]));
  const selectionMap = new Map();
  const journeyMap = new Map([[journey.id, journey]]);
  const authorizationValues = [...authorizations];
  let commitCount = 0;
  return {
    definitionMap,
    selectionMap,
    journeyMap,
    get commitCount() {
      return commitCount;
    },
    service: new PrimaryOperatingGeographyService({
      definitions: {
        async getById(id) {
          return definitionMap.get(id) ?? null;
        },
        async save(value) {
          definitionMap.set(value.id, value);
        },
      },
      selections: {
        async getByUserId(userId) {
          return selectionMap.get(userId) ?? null;
        },
      },
      authorizations: {
        async listByUserAndGeography(userId, geographyId) {
          return authorizationValues.filter(
            (value) =>
              value.subject.kind === "user" &&
              value.subject.userId === userId &&
              value.geographyId === geographyId,
          );
        },
        async save(value) {
          authorizationValues.push(value);
        },
      },
      lifecycle: {
        async getById(id) {
          return journeyMap.get(id) ?? null;
        },
        async save(value) {
          journeyMap.set(value.id, value);
        },
      },
      unitOfWork: {
        async commit(selection, lifecycle) {
          assert.equal(selection.userId, user.id);
          selectionMap.set(selection.userId, selection);
          journeyMap.set(lifecycle.id, lifecycle);
          commitCount += 1;
        },
      },
      now: () => now,
    }),
  };
}

test("GEO-003 stores canonical FIPS, boundary, relationship, bounds and default-camera metadata", () => {
  const definition = geography("released");
  assert.equal(definition.fipsCode, "51740");
  assert.equal(definition.type, "independent-city");
  assert.equal(definition.boundary.dataset, "TIGER/Line Places");
  assert.equal(definition.parentGeographyId, "us-va");
  assert.deepEqual(definition.adjacentGeographyIds, ["us-va-norfolk", "us-va-suffolk"]);
  assert.deepEqual(definition.bounds, {
    west: -76.42,
    south: 36.73,
    east: -76.21,
    north: 36.91,
  });
  assert.throws(
    () =>
      createGeographyDefinition({
        ...definition,
        id: "invalid-camera",
        fipsCode: "abc",
        now,
      }),
    /FIPS code/,
  );
});

test("GEO-007 enforces released, visible/unreleased, limited and restricted participation semantics", () => {
  const { user } = userFixture();
  const released = geography("released");
  const visible = geography("visible-unreleased");
  const limited = geography("limited", {
    limitedParticipationActivities: ["primary-geography-selection"],
  });
  const restricted = geography("restricted");
  const grant = createGeographyParticipationAuthorization(restricted, {
    id: "geography-grant-1",
    subject: { kind: "user", userId: user.id },
    activities: ["primary-geography-selection"],
    now,
  });

  assert.deepEqual(
    evaluateGeographyParticipation(
      released,
      user.id,
      "network-participation",
      [],
      now,
    ),
    { allowed: true, authority: "released" },
  );
  assert.deepEqual(
    evaluateGeographyParticipation(
      visible,
      user.id,
      "primary-geography-selection",
      [],
      now,
    ),
    { allowed: false, reason: "visible-unreleased" },
  );
  assert.equal(
    evaluateGeographyParticipation(
      limited,
      user.id,
      "primary-geography-selection",
      [],
      now,
    ).allowed,
    true,
  );
  assert.deepEqual(
    evaluateGeographyParticipation(limited, user.id, "orientation", [], now),
    { allowed: false, reason: "limited-activity-not-permitted" },
  );
  assert.deepEqual(
    evaluateGeographyParticipation(
      restricted,
      user.id,
      "primary-geography-selection",
      [],
      now,
    ),
    { allowed: false, reason: "restricted-authorization-required" },
  );
  assert.deepEqual(
    evaluateGeographyParticipation(
      restricted,
      user.id,
      "primary-geography-selection",
      [grant],
      now,
    ),
    { allowed: true, authority: "explicit-authorization" },
  );
});

test("GEO-001/002 atomically select canonical geography and advance only the owned authenticated journey", async () => {
  const { user, context } = userFixture();
  const journey = activatedJourney(user);
  const definition = geography("released");
  const memory = memoryService({ user, journey, definitions: [definition] });

  const result = await memory.service.select({
    context,
    accessJourneyId: journey.id,
    geographyId: definition.id,
  });

  assert.equal(result.selection.userId, user.id);
  assert.equal(result.selection.geographyId, definition.id);
  assert.equal(result.lifecycle.state, "geography-selected");
  assert.equal(memory.commitCount, 1);
  assert.equal(memory.selectionMap.get(user.id).geographyId, definition.id);
  assert.equal(memory.journeyMap.get(journey.id).state, "geography-selected");
});

test("GEO-002 denies unknown, unreleased and wrong-user client geography manipulation", async () => {
  const { user, context } = userFixture();
  const other = userFixture("usr_geography_other");
  const journey = activatedJourney(user);
  const visible = geography("visible-unreleased");
  const memory = memoryService({ user, journey, definitions: [visible] });

  await assert.rejects(
    memory.service.select({
      context,
      accessJourneyId: journey.id,
      geographyId: "client-invented-locality",
    }),
    (error) => error instanceof GeographySelectionError && error.code === "unknown-geography",
  );
  await assert.rejects(
    memory.service.select({
      context,
      accessJourneyId: journey.id,
      geographyId: visible.id,
    }),
    (error) =>
      error instanceof GeographySelectionError &&
      error.code === "geography-participation-denied",
  );
  await assert.rejects(
    memory.service.select({
      context: other.context,
      accessJourneyId: journey.id,
      geographyId: visible.id,
    }),
    (error) =>
      error instanceof GeographySelectionError && error.code === "access-journey-not-owned",
  );
  assert.equal(memory.commitCount, 0);
});

test("GEO-002 restricted locality selection requires a persisted server-side authorization", async () => {
  const { user, context } = userFixture();
  const journey = activatedJourney(user);
  const restricted = geography("restricted");
  const withoutGrant = memoryService({ user, journey, definitions: [restricted] });
  await assert.rejects(
    withoutGrant.service.select({
      context,
      accessJourneyId: journey.id,
      geographyId: restricted.id,
    }),
    (error) =>
      error instanceof GeographySelectionError &&
      error.code === "geography-participation-denied",
  );

  const grant = createGeographyParticipationAuthorization(restricted, {
    id: "geography-grant-2",
    subject: { kind: "user", userId: user.id },
    activities: ["primary-geography-selection", "orientation"],
    now,
  });
  const withGrant = memoryService({
    user,
    journey,
    definitions: [restricted],
    authorizations: [grant],
  });
  const result = await withGrant.service.select({
    context,
    accessJourneyId: journey.id,
    geographyId: restricted.id,
  });
  assert.equal(result.participation.authority, "explicit-authorization");
});

test("GEO-001 orientation gate requires and reauthorizes persisted canonical selection", async () => {
  const { user, context } = userFixture();
  const journey = activatedJourney(user);
  const released = geography("released");
  const memory = memoryService({ user, journey, definitions: [released] });

  await assert.rejects(
    memory.service.requireForOrientation({ context, accessJourneyId: journey.id }),
    (error) =>
      error instanceof GeographySelectionError && error.code === "primary-geography-required",
  );
  await memory.service.select({
    context,
    accessJourneyId: journey.id,
    geographyId: released.id,
  });
  const authorized = await memory.service.requireForOrientation({
    context,
    accessJourneyId: journey.id,
  });
  assert.equal(authorized.geography.id, released.id);

  const unreleased = geography("visible-unreleased", { id: released.id });
  memory.definitionMap.set(unreleased.id, unreleased);
  await assert.rejects(
    memory.service.requireForOrientation({ context, accessJourneyId: journey.id }),
    (error) =>
      error instanceof GeographySelectionError &&
      error.code === "geography-participation-denied",
  );
});

test("GEO-008 derives a provider-neutral camera plan from canonical locality metadata", () => {
  const definition = geography("released");
  assert.deepEqual(resolveGeographyCameraPlan(definition), {
    mode: "fit-authoritative-bounds",
    geographyId: definition.id,
    bounds: definition.bounds,
    center: { longitude: -76.31, latitude: 36.84 },
    pitchDegrees: 42,
    bearingDegrees: -12,
    paddingPixels: 48,
    maximumZoom: 13,
  });
});
