#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";
import { createPlatformAdministratorRoleConfiguration } from "../src/domain/admin-authorization/role-configuration.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import {
  createGeographyParticipationAuthorization,
  createPrimaryOperatingGeographySelection,
} from "../src/domain/geography/model.ts";
import { evaluateGeographyParticipation } from "../src/domain/geography/policy.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import {
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  createOrganizationServiceGeography,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import {
  createActivationJourneyContext,
  createActivationLegalAcceptance,
  updateActivationJourneyContext,
} from "../src/domain/onboarding/model.ts";
import {
  createOrganizationCapability,
  evaluateOrganizationProfileCompletion,
  updateEssentialOrganizationProfile,
} from "../src/domain/organization-profile/model.ts";
import { evaluateOrganizationMarkerActivation } from "../src/domain/organization-markers/model.ts";
import { ORIENTATION_STEP_SEQUENCE } from "../src/domain/orientation/model.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";
import { OrientationJourneyService } from "../src/application/orientation/orientation-journey.ts";
import { PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY } from "../src/application/participant/intelligence-context-storage.ts";
import { PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX } from "../src/application/participant/participant-spatial-context.ts";
import {
  HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "../src/data/geography/hampton-roads-controlled-locality.ts";
import { createFirestoreGeographyRepositories } from "../src/infrastructure/firestore/geography-repositories.ts";
import { FirestoreOrientationJourneyRepository } from "../src/infrastructure/firestore/orientation-journey.ts";
import { localeCookieName } from "../src/i18n/config.ts";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  RFXCHANGE_SESSION_DURATION_MS,
} from "../src/infrastructure/auth/firebase-server-session.ts";

const projectId = process.env.GCLOUD_PROJECT?.trim()
  || process.env.GOOGLE_CLOUD_PROJECT?.trim()
  || process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim()
  || "rfxchange";
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
const baselineWorktree = process.env.RFXCHANGE_ACCEPTANCE_BASE_WORKTREE?.trim();
const baselineSha = process.env.RFXCHANGE_ACCEPTANCE_BASE_SHA?.trim()
  || "7e61fd94232ad72de32f4776befdb61d9e729cf6";
const candidateSha = process.env.RFXCHANGE_ACCEPTANCE_CANDIDATE_SHA?.trim() || "unknown";
const configuredMapAcceptance = process.env.RFXCHANGE_CONFIGURED_MAP_ACCEPTANCE?.trim() === "1";
const outputPath = path.resolve(
  process.env.RFXCHANGE_ACCEPTANCE_OUTPUT?.trim()
    || "artifacts/exchange-shell-transition-evidence.json",
);

assert.ok(authEmulatorHost, "FIREBASE_AUTH_EMULATOR_HOST is required.");
assert.ok(firestoreEmulatorHost, "FIRESTORE_EMULATOR_HOST is required.");
assert.ok(baselineWorktree, "RFXCHANGE_ACCEPTANCE_BASE_WORKTREE is required.");

const runId = `shell-${Date.now()}-${randomBytes(3).toString("hex")}`;
const now = new Date().toISOString();
const organizationId = `org_${runId}`;
const externalOrganizationIds = Object.freeze({
  harbor: `org_harbor_${runId}`,
  tidewater: `org_tidewater_${runId}`,
  atlantic: `org_atlantic_${runId}`,
});
const membershipId = `membership_${runId}`;
const email = `${runId}@example.test`;
const password = `A9!${randomBytes(12).toString("base64url")}`;
const displayName = "Configured Shell Acceptance Organization";
const adminApp = initializeAdminApp({ projectId }, runId);
const adminAuth = getAdminAuth(adminApp);
const db = getFirestore(adminApp);

function userIdForFirebaseSubject(subject) {
  return `user-${createHash("sha256")
    .update(`rfxchange:user:firebase:${subject}`)
    .digest("hex")
    .slice(0, 32)}`;
}

function record(value) {
  return { ...value, schemaVersion: 1 };
}

function createLocation(organization, user, membership) {
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${runId}`,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    coordinate: [-76.2983, 36.8354],
    matchedAddress: "801 Crawford Street, Portsmouth, VA 23704",
    quality: "rooftop",
    provider: "configured-acceptance-fixture",
    providerReference: `fixture-${runId}`,
    benchmark: "exchange-shell-configured-acceptance",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${runId}`,
    organizationId: String(organization.id),
    requestedByUserId: String(user.id),
    membershipId: String(membership.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    physicalAddress: structuredPostalAddress({
      addressLine1: "801 Crawford Street",
      locality: "Portsmouth",
      regionCode: "VA",
      postalCode: "23704",
    }),
    isHomeOrPrivate: false,
    visibility: "exact",
    candidates: [candidate],
    now,
  });
  const confirmation = confirmOrganizationLocationDraft(draft, candidate.id, now);
  return createConfirmedOrganizationLocation({
    draft: confirmation.draft,
    candidate: confirmation.candidate,
    confirmedByUserId: String(user.id),
    confirmedByMembershipId: String(membership.id),
    now,
  });
}

function createDiscoverableOrganizationFixture({ id, displayName, coordinate, addressLine1 }) {
  const organization = createOrganizationAccount({ id, now });
  const user = createUserIdentity({
    id: `user_${id}`,
    name: `${displayName} Acceptance Actor`,
    primaryEmail: `${id}@example.test`,
    loginProvider: "firebase",
    loginSubject: `subject_${id}`,
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: `membership_${id}`,
    now,
  });
  const baseProfile = createOrganizationProfile(organization, {
    id: `profile_${id}`,
    displayName,
    now,
  });
  const profile = updateEssentialOrganizationProfile(baseProfile, {
    displayName,
    organizationType: "for-profit-business",
    website: { disposition: "available", url: `https://${id}.example.test` },
    mainContact: {
      displayName: `${displayName} Contact`,
      roleTitle: "Business Development",
      email: `${id}@example.test`,
      publiclyVisible: true,
    },
    capabilities: [createOrganizationCapability({
      id: `capability_${id}`,
      kind: "service",
      category: "professional-business-services",
      name: "Shell acceptance coordination",
      description: "Supports configured browser spatial-continuity acceptance.",
    })],
    participationRoles: ["business", "supplier"],
    businessObjectives: ["find-opportunities", "find-teammates"],
    now,
  });
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${id}`,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    coordinate,
    matchedAddress: `${addressLine1}, Portsmouth, VA 23704`,
    quality: "rooftop",
    provider: "configured-acceptance-fixture",
    providerReference: `fixture-${id}`,
    benchmark: "post-pr159-spatial-acceptance",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${id}`,
    organizationId: organization.id,
    requestedByUserId: user.id,
    membershipId: membership.id,
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    physicalAddress: structuredPostalAddress({
      addressLine1,
      locality: "Portsmouth",
      regionCode: "VA",
      postalCode: "23704",
    }),
    isHomeOrPrivate: false,
    visibility: "exact",
    candidates: [candidate],
    now,
  });
  const confirmation = confirmOrganizationLocationDraft(draft, candidate.id, now);
  const location = createConfirmedOrganizationLocation({
    draft: confirmation.draft,
    candidate: confirmation.candidate,
    confirmedByUserId: user.id,
    confirmedByMembershipId: membership.id,
    now,
  });
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: organization.id,
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    serviceGeographyIds: [String(PORTSMOUTH_CONTROLLED_LOCALITY.id)],
    updatedByUserId: user.id,
    updatedByMembershipId: membership.id,
    now,
  });
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies: serviceGeography,
    now,
  });
  assert.equal(completion.status, "active");
  const markerActivation = Object.freeze({
    id: organization.id,
    organizationId: organization.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    status: "active",
    coordinateSource: "confirmed-canonical-location",
    blockingReasons: Object.freeze([]),
    sourceLocationUpdatedAt: location.updatedAt,
    sourceProfileCompletionEvaluatedAt: completion.evaluatedAt,
    firstActivatedAt: now,
    lastTransitionAt: now,
    evaluatedAt: now,
  });
  return { organization, profile, location, serviceGeography, completion, markerActivation };
}

function createOpenParticipantState(user, organization, membership, profile) {
  const journeyId = `activation-${String(user.id)}`;
  let lifecycle = createAccessLifecycle({ id: journeyId, now });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
  lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, now);
  for (const state of [
    "account-activated",
    "geography-selected",
    "organization-resolved",
    "organization-registered",
    "organization-activated",
    "controlled-platform",
    "open-platform",
  ]) {
    lifecycle = advanceAccessLifecycle(lifecycle, state, now);
  }

  let activation = createActivationJourneyContext({
    userId: user.id,
    provisionalOrganizationName: profile.displayName,
    organizationRelationship: "authorized-representative",
    organizationIdentitySeed: {
      websiteDisposition: "available",
      websiteUrl: profile.website.url,
    },
    now,
  });
  activation = updateActivationJourneyContext(activation, {
    legalAcceptance: createActivationLegalAcceptance(now),
    orientationBridgeAcknowledgedAt: now,
    organizationId: organization.id,
    membershipId: membership.id,
    now,
  });

  const geographyAuthorization = createGeographyParticipationAuthorization(
    PORTSMOUTH_CONTROLLED_LOCALITY,
    {
      id: `geography-auth-${runId}`,
      subject: { kind: "user", userId: user.id },
      activities: ["organization-activation", "network-participation"],
      now,
    },
  );
  return Object.freeze({
    lifecycle,
    activation,
    selection: createPrimaryOperatingGeographySelection(
      user.id,
      accessJourneyId(journeyId),
      PORTSMOUTH_CONTROLLED_LOCALITY.id,
      now,
    ),
    geographyAuthorization,
  });
}

function createAdministratorAccount(administratorId, subject) {
  return Object.freeze({
    administratorId,
    subject,
    protectedAccount: false,
    status: "active",
    access: createPlatformAdministratorRoleConfiguration({
      administratorId,
      rolePresetKeys: ["platform-administrator"],
      addedPermissions: ["provider.application.read"],
      createdAt: now,
    }),
    scopeLimits: ["GLOBAL"],
    security: Object.freeze({
      locked: false,
      credentialResetRequired: false,
      mfaRequired: false,
      reauthenticationRequiredAfter: null,
      sessionsTerminatedAt: null,
    }),
    createdAt: now,
    updatedAt: now,
  });
}

async function seedParticipant() {
  const providerUser = await adminAuth.createUser({
    email,
    emailVerified: true,
    password,
    displayName: "Configured Shell Actor",
    disabled: false,
  });
  const userId = userIdForFirebaseSubject(providerUser.uid);
  const user = createUserIdentity({
    id: userId,
    name: "Configured Shell Actor",
    primaryEmail: email,
    loginProvider: "firebase",
    loginSubject: providerUser.uid,
    now,
  });
  const organization = createOrganizationAccount({
    id: organizationId,
    now,
  });
  const baseProfile = createOrganizationProfile(organization, {
    id: `profile-${runId}`,
    displayName,
    now,
  });
  const profile = updateEssentialOrganizationProfile(baseProfile, {
    displayName,
    organizationType: "for-profit-business",
    website: { disposition: "available", url: "https://example.test" },
    mainContact: {
      displayName: "Configured Shell Actor",
      roleTitle: "Owner",
      email,
      publiclyVisible: true,
    },
    capabilities: [createOrganizationCapability({
      id: `capability-${runId}`,
      kind: "service",
      category: "professional-business-services",
      name: "Configured browser acceptance",
      description: "Supports persistent participant-shell configured browser acceptance.",
    })],
    participationRoles: [],
    businessObjectives: [],
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: membershipId,
    now,
  });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "primary-administrator",
    permissions: [
      "organization.profile.manage",
      "resource.manage",
      "referral.manage",
      "rfx.create",
    ],
    now,
  });
  const open = createOpenParticipantState(user, organization, membership, profile);
  const location = createLocation(organization, user, membership);
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: String(organization.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    serviceGeographyIds: [String(PORTSMOUTH_CONTROLLED_LOCALITY.id)],
    updatedByUserId: String(user.id),
    updatedByMembershipId: String(membership.id),
    now,
  });
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies: serviceGeography,
    now,
  });
  assert.equal(completion.status, "active");
  const markerActivation = evaluateOrganizationMarkerActivation({
    organization,
    relationshipAuthorized: true,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    participation: evaluateGeographyParticipation(
      PORTSMOUTH_CONTROLLED_LOCALITY,
      user.id,
      "organization-activation",
      [open.geographyAuthorization],
      now,
    ),
    location,
    profileCompletion: completion,
    restriction: null,
    now,
  });
  assert.equal(markerActivation.status, "active");
  const externalOrganizations = [
    createDiscoverableOrganizationFixture({
      id: externalOrganizationIds.harbor,
      displayName: "Harbor Systems Group",
      coordinate: [-76.3002, 36.8364],
      addressLine1: "500 Crawford Street",
    }),
    createDiscoverableOrganizationFixture({
      id: externalOrganizationIds.tidewater,
      displayName: "Tidewater Advisory Partners",
      coordinate: [-76.3022, 36.8374],
      addressLine1: "600 Crawford Street",
    }),
    createDiscoverableOrganizationFixture({
      id: externalOrganizationIds.atlantic,
      displayName: "Atlantic Operations Group",
      coordinate: [-76.3032, 36.8379],
      addressLine1: "700 Crawford Street",
    }),
  ];

  await Promise.all(
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.map((definition) =>
      createFirestoreGeographyRepositories(db).definitions.save(definition),
    ),
  );
  await Promise.all([
    db.collection("users").doc(String(user.id)).set(record(user)),
    db.collection("organizations").doc(String(organization.id)).set(record(organization)),
    db.collection("organizationProfiles").doc(String(profile.id)).set(record(profile)),
    db.collection("organizationMemberships").doc(String(membership.id)).set(record(membership)),
    db.collection("organizationAuthorizations").doc(String(authorization.membershipId)).set(record(authorization)),
    db.collection("activationJourneyContexts").doc(String(user.id)).set(record(open.activation)),
    db.collection("accessJourneys").doc(String(open.lifecycle.id)).set(record(open.lifecycle)),
    db.collection("primaryGeographySelections").doc(String(user.id)).set(record(open.selection)),
    db.collection("geographyParticipationAuthorizations").doc(String(open.geographyAuthorization.id)).set(record(open.geographyAuthorization)),
    db.collection("organizationLocations").doc(String(organization.id)).set(record(location)),
    db.collection("organizationServiceGeographies").doc(String(serviceGeography.id)).set(record(serviceGeography)),
    db.collection("organizationProfileCompletions").doc(String(organization.id)).set(record(completion)),
    db.collection("organizationMarkerActivations").doc(String(organization.id)).set(record(markerActivation)),
    ...externalOrganizations.flatMap((fixture) => [
      db.collection("organizations").doc(String(fixture.organization.id)).set(record(fixture.organization)),
      db.collection("organizationProfiles").doc(String(fixture.profile.id)).set(record(fixture.profile)),
      db.collection("organizationLocations").doc(String(fixture.organization.id)).set(record(fixture.location)),
      db.collection("organizationServiceGeographies").doc(String(fixture.organization.id)).set(record(fixture.serviceGeography)),
      db.collection("organizationProfileCompletions").doc(String(fixture.organization.id)).set(record(fixture.completion)),
      db.collection("organizationMarkerActivations").doc(String(fixture.organization.id)).set(record(fixture.markerActivation)),
    ]),
  ]);

  const administratorId = `administrator-${runId}`;
  const account = createAdministratorAccount(administratorId, providerUser.uid);
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId,
    rolePresetKeys: ["platform-administrator"],
    effectivePermissions: ["provider.application.read"],
  });
  const grant = createAdminPermissionGrant({
    id: `grant-${runId}`,
    administratorId,
    permission: "provider.application.read",
    scope: "GLOBAL",
    createdAt: now,
  });
  await Promise.all([
    db.collection("platformAdministrators").doc(administratorId).set(record(account)),
    db.collection("adminAuthorityContexts").doc(administratorId).set(record(authority)),
    db.collection("adminPermissionGrants").doc(String(grant.id)).set(record(grant)),
  ]);

  const clientApp = initializeClientApp({
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123456789:web:${runId}`,
  }, `client-${runId}`);
  const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
  connectAuthEmulator(clientAuth, `http://${authEmulatorHost}`, { disableWarnings: true });
  const credential = await signInWithEmailAndPassword(clientAuth, email, password);
  const idToken = await credential.user.getIdToken(true);
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: RFXCHANGE_SESSION_DURATION_MS,
  });
  await deleteClientApp(clientApp);

  return Object.freeze({
    providerUid: providerUser.uid,
    userId: String(user.id),
    administratorId,
    grantId: String(grant.id),
    sessionCookie,
  });
}

async function removeAdministrativeAccess(seed) {
  await Promise.all([
    db.collection("platformAdministrators").doc(seed.administratorId).delete(),
    db.collection("adminAuthorityContexts").doc(seed.administratorId).delete(),
    db.collection("adminPermissionGrants").doc(seed.grantId).delete(),
  ]);
}

async function pathExists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function chromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  throw new Error(`No supported Chrome/Chromium binary found: ${candidates.join(", ")}`);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForHttp(url, processHandle, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Server exited before becoming ready (${processHandle.exitCode}).`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status > 0) return;
    } catch {
      // Startup is still in progress.
    }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}.`);
}

function startServer(cwd, port, label) {
  const output = [];
  const nextBinary = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(
    process.execPath,
    [nextBinary, "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        RFXCHANGE_ENV: "development",
        RFXCHANGE_EXPECTED_PROJECT_ID: projectId,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
        NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
        NEXT_PUBLIC_FIREBASE_APP_ID: `1:123456789:web:${runId}`,
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      output.push(String(chunk));
      if (output.length > 400) output.shift();
    });
  }
  child.acceptanceLabel = label;
  child.acceptanceOutput = output;
  return child;
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  const deadline = Date.now() + 5_000;
  while (child.exitCode === null && Date.now() < deadline) await wait(100);
  if (child.exitCode === null) child.kill("SIGKILL");
}

class CdpSession {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
        else pending.resolve(message.result ?? {});
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
    });
    return this;
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket?.close();
  }
}

async function launchChrome(debugPort) {
  const binary = await chromeBinary();
  const profile = path.join(tmpdir(), `${runId}-chrome-${debugPort}`);
  await rm(profile, { recursive: true, force: true });
  const browserArguments = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,1000",
    "about:blank",
  ];
  if (configuredMapAcceptance) {
    browserArguments.splice(3, 0, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader");
  } else {
    browserArguments.splice(3, 0, "--disable-gpu");
  }
  const child = spawn(binary, browserArguments, { stdio: "ignore" });
  const endpoint = `http://127.0.0.1:${debugPort}`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Chrome exited with ${child.exitCode}.`);
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) return { child, endpoint, profile };
    } catch {
      // Chrome is still starting.
    }
    await wait(100);
  }
  await stopProcess(child);
  throw new Error("Timed out waiting for Chrome DevTools.");
}

async function createPage(chrome, baseUrl, sessionCookie, locale = "en-US") {
  const response = await fetch(`${chrome.endpoint}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
  assert.equal(response.ok, true, `Could not create Chrome target (${response.status}).`);
  const target = await response.json();
  const cdp = await new CdpSession(target.webSocketDebuggerUrl).connect();
  const diagnostics = {
    consoleErrors: [],
    exceptions: [],
    documentRequests: [],
    protectedRequests: [],
    serverTiming: [],
  };

  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    diagnostics.exceptions.push(
      exceptionDetails?.exception?.description
        ?? exceptionDetails?.text
        ?? "Runtime exception",
    );
  });
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type !== "error" && type !== "assert") return;
    diagnostics.consoleErrors.push(args?.map((arg) => arg.value ?? arg.description).join(" ") ?? type);
  });
  cdp.on("Network.requestWillBeSent", ({ request, type }) => {
    if (type === "Document") diagnostics.documentRequests.push(request.url);
    if (/onboarding|orientation|activation|geography\/initialize/i.test(request.url)) {
      diagnostics.protectedRequests.push(request.url);
    }
  });
  cdp.on("Network.responseReceived", ({ response }) => {
    const headers = response?.headers ?? {};
    const serverTiming = headers["server-timing"] ?? headers["Server-Timing"];
    if (serverTiming) diagnostics.serverTiming.push({ url: response.url, value: serverTiming });
  });

  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
    cdp.send("Log.enable"),
  ]);
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__rfxAcceptance = { errors: [], transitions: [], takeover: false, contentReplaced: false };
      window.addEventListener("error", (event) => window.__rfxAcceptance.errors.push(String(event.message || "window error")));
      window.addEventListener("unhandledrejection", (event) => window.__rfxAcceptance.errors.push(String(event.reason || "unhandled rejection")));
      window.addEventListener("rfxchange:participant-transition", (event) => window.__rfxAcceptance.transitions.push(event.detail));
    `,
  });
  await cdp.send("Network.setCookie", {
    name: RFXCHANGE_SESSION_COOKIE_NAME,
    value: sessionCookie,
    url: baseUrl,
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
  await cdp.send("Network.setCookie", {
    name: localeCookieName,
    value: locale,
    url: baseUrl,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  });

  return { cdp, diagnostics };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function waitForExpression(cdp, expression, label, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await evaluate(cdp, expression);
      if (last) return last;
    } catch (error) {
      last = String(error);
    }
    await wait(50);
  }
  throw new Error(`Timed out waiting for ${label}. Last value: ${JSON.stringify(last)}`);
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitForExpression(
    cdp,
    `document.readyState === "complete" && Boolean(document.querySelector("[data-participant-navigation]"))`,
    `participant navigation at ${url}`,
  );
}

async function beginObservation(cdp) {
  await evaluate(cdp, `(() => {
    const state = window.__rfxAcceptance;
    state.takeover = false;
    state.contentReplaced = false;
    state.contentBefore = document.querySelector("[data-participant-content-region]")?.firstElementChild || null;
    state.transitionStartedAt = performance.now();
    state.observer?.disconnect?.();
    state.observer = new MutationObserver(() => {
      const text = document.body?.innerText || "";
      if (text.includes("Preparing this page") || text.includes("Loading RFxchange")) state.takeover = true;
      if (state.contentBefore && !state.contentBefore.isConnected) state.contentReplaced = true;
    });
    state.observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    return true;
  })()`);
}

async function finishObservation(cdp) {
  return evaluate(cdp, `(() => {
    const state = window.__rfxAcceptance;
    state.observer?.disconnect?.();
    return {
      takeover: state.takeover,
      contentReplaced: state.contentReplaced,
      durationMs: performance.now() - state.transitionStartedAt,
      navigationEntries: performance.getEntriesByType("navigation").length,
      pathname: location.pathname,
      search: location.search,
    };
  })()`);
}

async function ensureShellToken(cdp) {
  return evaluate(cdp, `(() => {
    const shell = document.querySelector("[data-participant-shell]");
    if (!shell) return null;
    if (!shell.dataset.acceptanceShellToken) shell.dataset.acceptanceShellToken = crypto.randomUUID();
    return shell.dataset.acceptanceShellToken;
  })()`);
}

async function clickHref(cdp, href, expectedPath, { candidate = false, latencyMs = 0 } = {}) {
  const wallStartedAt = performance.now();
  if (latencyMs > 0) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: latencyMs,
      downloadThroughput: 1_000_000,
      uploadThroughput: 1_000_000,
      connectionType: "wifi",
    });
  }
  await beginObservation(cdp);
  const immediate = await evaluate(cdp, `(async () => {
    const link = document.querySelector('[data-participant-navigation] a[href="${href}"]')
      || document.querySelector('a[href="${href}"]');
    if (!link) return { found: false };
    link.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const header = document.querySelector("[data-participant-shell-header]");
    const contentBefore = window.__rfxAcceptance.contentBefore;
    return {
      found: true,
      shellVisible: Boolean(header && getComputedStyle(header).display !== "none"),
      pending: link.getAttribute("aria-busy") === "true"
        || link.dataset.pending === "true"
        || Boolean(link.querySelector('[data-link-pending="true"]')),
      contentPreserved: Boolean(contentBefore && contentBefore.isConnected),
      routeCommitted: location.pathname === ${JSON.stringify(expectedPath)},
      currentText: document.body.innerText || "",
    };
  })()`);
  assert.equal(immediate.found, true, `Missing navigation link ${href}.`);
  if (candidate) {
    assert.equal(immediate.shellVisible, true, `Shell disappeared after clicking ${href}.`);
    assert.equal(
      immediate.pending || immediate.routeCommitted,
      true,
      `No immediate pending feedback for ${href}.`,
    );
    assert.equal(
      immediate.contentPreserved || immediate.routeCommitted,
      true,
      `Current content was replaced before ${href} committed.`,
    );
    assert.equal(immediate.currentText.includes("Preparing this page"), false);
  }
  await waitForExpression(cdp, `location.pathname === "${expectedPath}"`, expectedPath);
  const routeCommitMs = performance.now() - wallStartedAt;
  await waitForExpression(cdp, `Boolean(document.querySelector("[data-participant-content-region] > *"))`, `${expectedPath} content settlement`);
  const observation = await finishObservation(cdp);
  const contentSettlementMs = Number.isFinite(observation.durationMs)
    ? observation.durationMs
    : performance.now() - wallStartedAt;
  observation.durationMs = routeCommitMs;
  observation.contentSettlementMs = contentSettlementMs;
  observation.immediatePendingFeedback = immediate.pending ?? false;
  observation.immediateRouteCommitted = immediate.routeCommitted ?? false;
  observation.immediateContentPreserved = immediate.contentPreserved ?? false;
  if (latencyMs > 0) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: "none",
    });
  }
  return observation;
}

async function clickLens(cdp, id, expectedPath, options = {}) {
  const href = await evaluate(cdp, `document.querySelector('[data-participant-navigation] a[data-participant-lens="${id}"]')?.getAttribute("href") || null`);
  assert.ok(href, `Missing enabled ${id} lens.`);
  return clickHref(cdp, href, expectedPath, options);
}

async function clickUtility(cdp, href, expectedPath, candidate) {
  await evaluate(cdp, `(() => {
    if (!document.querySelector('[role="menu"]')) {
      document.querySelector('[data-participant-utility="account"] > button')?.click();
    }
  })()`);
  await waitForExpression(cdp, `Boolean(document.querySelector('[role="menu"] a[href="${href}"]'))`, href);
  return clickHref(cdp, href, expectedPath, { candidate });
}

function percentile(values, quantile) {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return null;
  const sorted = [...finiteValues].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantile));
  return Number(sorted[index].toFixed(1));
}

function summarizedLoggedServerTimings(server) {
  const grouped = new Map();
  for (const line of server.acceptanceOutput.join("").split("\n")) {
    if (!line.includes('"type":"rfx.server-timing"')) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.type !== "rfx.server-timing" || typeof entry.name !== "string" || !Number.isFinite(entry.durationMs)) continue;
      const current = grouped.get(entry.name) ?? { description: entry.description ?? "", values: [] };
      current.values.push(entry.durationMs);
      grouped.set(entry.name, current);
    } catch {
      // Non-JSON framework output is irrelevant to server timing evidence.
    }
  }
  return [...grouped.entries()].map(([name, group]) => Object.freeze({
    name,
    description: group.description,
    count: group.values.length,
    minimumMs: Math.min(...group.values),
    medianMs: percentile(group.values, 0.5),
    maximumMs: Math.max(...group.values),
  }));
}

async function runBaseline({ cwd, port, sessionCookie }) {
  const server = startServer(cwd, port, "baseline");
  let chrome;
  try {
    await waitForHttp(`http://127.0.0.1:${port}/`, server);
    chrome = await launchChrome(9301);
    const baseUrl = `http://127.0.0.1:${port}`;
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await navigate(cdp, `${baseUrl}/geography/canvas?organizationId=${organizationId}`);
    let token = await ensureShellToken(cdp);
    let remounts = 0;
    const observations = [];
    for (const [kind, target, route] of [
      ["lens", "resources", "/resources"],
      ["lens", "referrals", "/referrals"],
      ["lens", "intelligence", "/geography/canvas"],
      ["utility", "/organization-profile", "/organization-profile"],
      ["utility", "/quick-start", "/quick-start"],
    ]) {
      observations.push(
        kind === "lens"
          ? await clickLens(cdp, target, route, {
              latencyMs: target === "resources" ? 450 : 0,
            })
          : await clickUtility(cdp, target, route, false),
      );
      const nextToken = await ensureShellToken(cdp);
      if (token && nextToken !== token) remounts += 1;
      token = nextToken;
    }
    const browserState = await evaluate(cdp, `({
      navigationEntries: performance.getEntriesByType("navigation").length,
      errors: window.__rfxAcceptance.errors,
      query: location.search,
    })`);
    cdp.close();
    const durations = observations.map((item) => item.durationMs);
    return {
      sha: baselineSha,
      observations,
      medianTransitionMs: percentile(durations, 0.5),
      p90TransitionMs: percentile(durations, 0.9),
      shellRemounts: remounts,
      rootTakeoverObserved: observations.some((item) => item.takeover),
      browserState,
      documentRequests: diagnostics.documentRequests,
      serverTiming: diagnostics.serverTiming,
    };
  } finally {
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
    await stopProcess(server);
  }
}

async function assertPrimaryNavigation(cdp) {
  const contract = await evaluate(cdp, `(() => {
    const nav = document.querySelector('[data-participant-navigation] > nav');
    const items = Array.from(nav?.querySelectorAll('[data-participant-lens]') || []);
    return items.map((item) => ({
      id: item.dataset.participantLens,
      availability: item.dataset.availability,
      href: item.closest('a')?.getAttribute('href') || null,
      disabled: item.getAttribute('aria-disabled'),
      describedBy: item.getAttribute('aria-describedby'),
      text: item.textContent?.trim() || '',
      current: item.getAttribute('aria-current'),
    }));
  })()`);
  assert.deepEqual(contract.map((item) => item.id), [
    "opportunities-rfx",
    "resources",
    "intelligence",
    "referrals",
  ]);
  assert.equal(contract[0].availability, "unavailable");
  assert.equal(contract[0].href, null);
  assert.equal(contract[0].disabled, "true");
  assert.ok(contract[0].describedBy);
  assert.match(contract[0].text, /Opportunities\/RFx/);
  assert.match(contract[0].text, /available/i);
  assert.equal(contract[0].current, null);
  assert.deepEqual(contract.slice(1).map((item) => item.availability), ["enabled", "enabled", "enabled"]);
}

async function assertAdministrationVisible(cdp) {
  await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
  await waitForExpression(cdp, `Boolean(document.querySelector('[role="menu"] a[href="/admin"]'))`, "Administration utility");
  await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
}

async function runCandidate({ cwd, port, sessionCookie }) {
  const server = startServer(cwd, port, "candidate");
  let chrome;
  try {
    await waitForHttp(`http://127.0.0.1:${port}/`, server);
    chrome = await launchChrome(9302);
    const baseUrl = `http://127.0.0.1:${port}`;
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    const initialUrl = `${baseUrl}/geography/canvas?query=shell-acceptance&selectedOrganization=${organizationId}`;
    await navigate(cdp, initialUrl);
    await assertPrimaryNavigation(cdp);
    await assertAdministrationVisible(cdp);

    const initialShell = await evaluate(cdp, `document.querySelector('[data-participant-shell="persistent"]')?.dataset.participantShellInstance || null`);
    assert.ok(initialShell, "Persistent shell instance was not present.");
    const initialNavigationEntries = await evaluate(cdp, `performance.getEntriesByType("navigation").length`);
    assert.equal(initialNavigationEntries, 1);

    const observations = [];
    observations.push(await clickLens(cdp, "resources", "/resources", { candidate: true, latencyMs: 450 }));
    observations.push(await clickLens(cdp, "referrals", "/referrals", { candidate: true }));
    observations.push(await clickLens(cdp, "intelligence", "/geography/canvas", { candidate: true }));
    assert.equal(
      await evaluate(cdp, `location.search`),
      `?query=shell-acceptance&selectedOrganization=${organizationId}`,
      "Returning to Intelligence discarded safe URL-derived map/query context.",
    );
    const inContentIntelligenceHref =
      `/geography/canvas?query=shell-in-content&selectedOrganization=${organizationId}`;
    await evaluate(cdp, `history.replaceState({}, "", ${JSON.stringify(inContentIntelligenceHref)})`);
    await waitForExpression(
      cdp,
      `document.querySelector('[data-participant-navigation] a[data-participant-lens="intelligence"]')
        ?.getAttribute("href") === ${JSON.stringify(inContentIntelligenceHref)}`,
      "Intelligence context captured before an in-content exit",
    );
    observations.push(await clickUtility(cdp, "/organization-profile", "/organization-profile", true));
    await waitForExpression(
      cdp,
      `document.querySelector('[data-participant-utility="account"] > button')
        ?.getAttribute("aria-label")?.includes(${JSON.stringify(displayName)})`,
      "authorized organization identity in Account utility",
    );
    observations.push(await clickUtility(cdp, "/quick-start", "/quick-start", true));

    const finalState = await evaluate(cdp, `(() => ({
      shellInstance: document.querySelector('[data-participant-shell="persistent"]')?.dataset.participantShellInstance || null,
      navigationEntries: performance.getEntriesByType("navigation").length,
      transitions: window.__rfxAcceptance.transitions,
      errors: window.__rfxAcceptance.errors,
      takeoverText: (document.body.innerText || '').includes('Preparing this page'),
      activationReplay: Boolean(document.querySelector('[data-activation-animation], [data-onboarding-sequence]')),
    }))()`);
    assert.equal(finalState.shellInstance, initialShell, "Participant shell remounted during the transition sequence.");
    assert.equal(finalState.navigationEntries, 1, "A second document navigation occurred.");
    assert.equal(finalState.takeoverText, false);
    assert.equal(finalState.activationReplay, false);
    assert.equal(finalState.errors.length, 0, finalState.errors.join("\n"));
    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));
    assert.equal(diagnostics.documentRequests.length, 1, diagnostics.documentRequests.join("\n"));
    assert.equal(
      diagnostics.protectedRequests.filter((url) => !url.includes("/orientation")).length,
      0,
      diagnostics.protectedRequests.join("\n"),
    );
    assert.equal(observations.some((item) => item.takeover), false);
    assert.equal(
      observations[0].immediateContentPreserved || observations[0].immediateRouteCommitted,
      true,
      "Delayed Resources transition replaced the current workspace before commit.",
    );
    assert.equal(observations.every((item) => item.navigationEntries === 1), true);

    const ordinaryDocumentRequests = [...diagnostics.documentRequests];
    await cdp.send("Page.reload", { ignoreCache: true });
    const restoredIntelligenceHref = await waitForExpression(
      cdp,
      `document.readyState === "complete"
        && document.querySelector('[data-participant-navigation] a[data-participant-lens="intelligence"]')
          ?.getAttribute("href")`,
      "restored Intelligence href after shell remount",
    );
    assert.equal(
      restoredIntelligenceHref,
      inContentIntelligenceHref,
      "Shell remount discarded the safe session-scoped Intelligence context.",
    );
    await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
    await waitForExpression(
      cdp,
      `Boolean(document.querySelector('[role="menu"] button[role="menuitem"]'))`,
      "Sign out utility",
    );
    await evaluate(cdp, `document.querySelector('[role="menu"] button[role="menuitem"]')?.click()`);
    await waitForExpression(cdp, `location.pathname === "/"`, "signed-out public entry");
    assert.equal(
      await evaluate(
        cdp,
        `sessionStorage.getItem(${JSON.stringify(PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY)})`,
      ),
      null,
      "Signing out retained another participant's Intelligence context.",
    );
    assert.deepEqual(
      await evaluate(
        cdp,
        `Object.keys(sessionStorage).filter((key) => key.startsWith(${JSON.stringify(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)}))`,
      ),
      [],
      "Signing out retained participant spatial context.",
    );
    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));

    const durations = observations.map((item) => item.durationMs);
    const result = {
      sha: candidateSha,
      observations,
      medianTransitionMs: percentile(durations, 0.5),
      p90TransitionMs: percentile(durations, 0.9),
      persistentShellInstance: initialShell,
      shellRemounts: 0,
      rootTakeoverObserved: false,
      fullDocumentNavigationCount: ordinaryDocumentRequests.length,
      intelligenceContextPreserved: true,
      intelligenceContextCapturedForInContentExit: true,
      intelligenceContextRestoredAfterShellRemount: true,
      intelligenceContextClearedOnSignOut: true,
      spatialContextClearedOnSignOut: true,
      authorizedOrganizationContextReported: true,
      activationReplayObserved: finalState.activationReplay,
      protectedInitializationReplayObserved: false,
      transitionEvents: finalState.transitions,
      documentRequests: ordinaryDocumentRequests,
      serverTiming: diagnostics.serverTiming,
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
    cdp.close();
    return { result, server, baseUrl };
  } catch (error) {
    console.error(`Candidate server output:\n${server.acceptanceOutput.join("")}`);
    await stopProcess(server);
    throw error;
  } finally {
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
  }
}

async function runAuthorizationAndAliasBoundaries({ baseUrl, sessionCookie }) {
  let chrome;
  try {
    chrome = await launchChrome(9304);
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await navigate(cdp, `${baseUrl}/organization-profile`);

    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 450,
      downloadThroughput: 1_000_000,
      uploadThroughput: 1_000_000,
      connectionType: "wifi",
    });
    assert.equal(
      await evaluate(cdp, `Boolean(document.querySelector('a[href="/provider-application"]'))`),
      true,
      "Authorized Account did not expose the provider-application route.",
    );
    await beginObservation(cdp);
    const providerImmediate = await evaluate(cdp, `(async () => {
      const prior = document.querySelector("[data-participant-content-region]")?.firstElementChild;
      const link = document.querySelector('a[href="/provider-application"]');
      link?.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        pending: Boolean(link?.querySelector('[data-link-pending="true"]')),
        contentPreserved: Boolean(prior?.isConnected),
      };
    })()`);
    assert.equal(providerImmediate.contentPreserved, true, "Provider alias replaced Account before the route was ready.");
    await waitForExpression(cdp, `location.pathname === "/provider-application"`, "provider-application route");
    const aliasLoadingState = await evaluate(cdp, `({
      pathname: location.pathname,
      accountCurrent: document.querySelector('[data-participant-utility="account"] > button')
        ?.dataset.current === "true",
      participantAuthorized: document.querySelector('[data-participant-authorized]')
        ?.getAttribute("data-participant-authorized") === "true",
    })`);
    assert.equal(aliasLoadingState.accountCurrent, true, "Provider alias lost Account-current state while loading.");
    assert.equal(aliasLoadingState.participantAuthorized, true);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: "none",
    });
    await finishObservation(cdp);

    await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
    await waitForExpression(
      cdp,
      `Boolean(document.querySelector('[role="menu"] button[role="menuitem"]'))`,
      "boundary-test sign out utility",
    );
    await evaluate(cdp, `document.querySelector('[role="menu"] button[role="menuitem"]')?.click()`);
    await waitForExpression(cdp, `location.pathname === "/"`, "boundary-test signed-out entry");

    const expectSignedOutKey = "rfxchange:shell-acceptance:expect-signed-out";
    const shellObservedKey = "rfxchange:shell-acceptance:unauthorized-shell-observed";
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        (() => {
          if (sessionStorage.getItem(${JSON.stringify(expectSignedOutKey)}) !== "true") return;
          const detect = () => {
            if (document.querySelector("[data-participant-navigation], [data-participant-shell='persistent']")) {
              sessionStorage.setItem(${JSON.stringify(shellObservedKey)}, "true");
            }
          };
          detect();
          new MutationObserver(detect).observe(document, { subtree: true, childList: true });
        })();
      `,
    });
    await evaluate(
      cdp,
      `sessionStorage.setItem(${JSON.stringify(expectSignedOutKey)}, "true")`,
    );
    await cdp.send("Page.navigate", { url: `${baseUrl}/resources` });
    await waitForExpression(
      cdp,
      `location.pathname === "/signin" && document.readyState === "complete"`,
      "signed-out protected-route redirect",
    );
    await wait(100);
    const unauthorizedState = await evaluate(cdp, `({
      shellObserved: sessionStorage.getItem(${JSON.stringify(shellObservedKey)}) === "true",
      navigationPresent: Boolean(document.querySelector("[data-participant-navigation]")),
      shellPresent: Boolean(document.querySelector("[data-participant-shell='persistent']")),
    })`);
    assert.deepEqual(unauthorizedState, {
      shellObserved: false,
      navigationPresent: false,
      shellPresent: false,
    });
    await evaluate(
      cdp,
      `sessionStorage.removeItem(${JSON.stringify(expectSignedOutKey)});
       sessionStorage.removeItem(${JSON.stringify(shellObservedKey)});`,
    );
    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));
    cdp.close();
    return {
      providerAliasAccountCurrentWhileLoading: aliasLoadingState.accountCurrent,
      participantAuthorizationRetainedAcrossAliasLoading: aliasLoadingState.participantAuthorized,
      unauthorizedParticipantShellObserved: unauthorizedState.shellObserved,
      signedOutRedirect: "/signin",
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
  } finally {
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
  }
}

function cameraSnapshotFromDom(cdp) {
  return evaluate(cdp, `(() => {
    const scene = document.querySelector('[data-map-ready="true"]');
    const [longitude, latitude] = (scene?.dataset.mapCenter || '').split(',').map(Number);
    return {
      viewMode: scene?.dataset.mapViewMode || null,
      pitch: Number(scene?.dataset.mapPitch),
      bearing: Number(scene?.dataset.mapBearing),
      longitude,
      latitude,
      zoom: Number(scene?.dataset.mapZoom),
      selectedMarkerId: scene?.dataset.selectedMarkerId || null,
      selectedMarkerIdentity: scene?.dataset.selectedMarkerIdentity || null,
      markerCount: Number(scene?.dataset.networkMarkerCount),
      clusterCount: Number(scene?.dataset.renderedClusterCount),
      clusterPoint: scene?.dataset.renderedClusterPoint || null,
      selectedStandingCount: Number(scene?.dataset.renderedSelectedMarkerCount),
      padding: (scene?.dataset.mapPadding || '').split(',').map(Number),
      cameraInitialization: scene?.dataset.cameraInitialization || null,
    };
  })()`);
}

async function waitForCameraPadding(cdp, side, label, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await cameraSnapshotFromDom(cdp);
    const [, right, , left] = last.padding;
    if (side === "right" ? right >= 100 && right > left : left >= 100 && left > right) return last;
    await wait(50);
  }
  throw new Error(`Timed out waiting for ${label}. Last camera snapshot: ${JSON.stringify(last)}`);
}

function assertCameraNear(actual, expected, label) {
  assert.ok(Math.abs(actual.longitude - expected.longitude) < 0.00001, `${label} changed longitude.`);
  assert.ok(Math.abs(actual.latitude - expected.latitude) < 0.00001, `${label} changed latitude.`);
  assert.ok(Math.abs(actual.zoom - expected.zoom) < 0.05, `${label} changed zoom.`);
  assert.ok(Math.abs(actual.bearing - expected.bearing) < 0.05, `${label} changed bearing.`);
}

async function chooseMapView(cdp, mode, pitch) {
  await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('[role="group"][aria-label="Map view"] button')]
      .find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(mode)});
    button?.click();
  })()`);
  await waitForExpression(
    cdp,
    `(() => {
      const scene = document.querySelector('[data-map-ready="true"]');
      const button = [...document.querySelectorAll('[role="group"][aria-label="Map view"] button')]
        .find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(mode)});
      return scene?.dataset.mapViewMode === ${JSON.stringify(mode.toLowerCase())}
        && Math.abs(Number(scene?.dataset.mapPitch) - ${pitch}) < 1
        && button?.getAttribute('aria-pressed') === 'true';
    })()`,
    `${mode} actual Mapbox pitch`,
  );
  return cameraSnapshotFromDom(cdp);
}

async function runSpatialAcceptance({ baseUrl, sessionCookie }) {
  let chrome;
  try {
    chrome = await launchChrome(9305);
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await navigate(cdp, `${baseUrl}/geography/canvas?query=shell-acceptance&selectedOrganization=${organizationId}`);
    await waitForExpression(cdp, `Boolean(document.querySelector('[data-map-ready="true"]'))`, "configured Mapbox scene", 45_000);
    await waitForExpression(
      cdp,
      `(() => { const scene = document.querySelector('[data-map-ready="true"]'); return scene?.dataset.mapViewMode === '3d' && Math.abs(Number(scene.dataset.mapPitch) - 75) < 1; })()`,
      "settled initial 3D Mapbox pitch",
      45_000,
    );
    await waitForExpression(
      cdp,
      `document.querySelectorAll('[data-organization-id]').length >= 2`,
      "discoverable Organization B and C results",
    );

    const ownActions = await evaluate(cdp, `Object.fromEntries([...document.querySelectorAll('[data-organization-action]')].map((action) => [action.dataset.organizationAction, { available: action.tagName === 'A', disabled: action.getAttribute('aria-disabled') === 'true', href: action.getAttribute('href') }]))`);
    assert.equal(ownActions["manage-profile"].href, "/organization-profile");
    assert.equal(ownActions["view-resources"].href, "/resources");
    assert.equal(ownActions["start-referral"].href, "/referrals");
    assert.equal(ownActions["opportunities-rfx"].disabled, true);

    const initial = await cameraSnapshotFromDom(cdp);
    assert.equal(initial.viewMode, "3d");
    assert.ok(Math.abs(initial.pitch - 75) < 1, `Initial actual pitch was ${initial.pitch}.`);
    assert.ok(initial.markerCount >= 3, `Expected at least three external markers, found ${initial.markerCount}.`);
    assert.match(initial.selectedMarkerIdentity, /^[A-Z]{1,2}$/);
    const desktopAccountAvatar = await evaluate(cdp, `(() => {
      const button = document.querySelector('[data-participant-utility="account"] > button');
      const avatar = button?.firstElementChild;
      const buttonRect = button?.getBoundingClientRect();
      const avatarRect = avatar?.getBoundingClientRect();
      return buttonRect && avatarRect ? { hitWidth: buttonRect.width, hitHeight: buttonRect.height, avatarWidth: avatarRect.width, avatarHeight: avatarRect.height } : null;
    })()`);
    assert.ok(desktopAccountAvatar?.hitWidth >= 44 && desktopAccountAvatar?.hitHeight >= 44);
    assert.ok(desktopAccountAvatar?.avatarWidth >= 30 && desktopAccountAvatar?.avatarWidth <= 36);

    const perspective = await chooseMapView(cdp, "Perspective", 35);
    const harborMarkerId = await evaluate(cdp, `document.querySelector('[data-organization-id="${externalOrganizationIds.harbor}"]')?.dataset.markerId || null`);
    const visibleOrganizationIds = await evaluate(cdp, `[...document.querySelectorAll('[data-organization-id]')].map((element) => element.dataset.organizationId)`);
    assert.ok(harborMarkerId, `Organization B marker id was unavailable among ${JSON.stringify(visibleOrganizationIds)}.`);
    await evaluate(cdp, `document.querySelector('[data-organization-id="${externalOrganizationIds.harbor}"]')?.click()`);
    await waitForExpression(
      cdp,
      `document.querySelector('#organization-detail-panel')?.dataset.selectedOrganizationId === ${JSON.stringify(externalOrganizationIds.harbor)}`,
      "Organization B detail selection",
    );
    await waitForExpression(
      cdp,
      `document.querySelector('[data-organization-id="${externalOrganizationIds.harbor}"]')?.getAttribute('aria-pressed') === 'true'`,
      "Organization B list selection",
    );
    await waitForExpression(
      cdp,
      `document.querySelector('[data-map-ready="true"]')?.dataset.selectedMarkerId === ${JSON.stringify(harborMarkerId)}`,
      "Organization B map selection",
    );
    await waitForCameraPadding(cdp, "right", "Organization B right-side padding");
    const selectedPerspective = await cameraSnapshotFromDom(cdp);
    assert.equal(selectedPerspective.viewMode, "perspective");
    assert.ok(Math.abs(selectedPerspective.pitch - 35) < 1);
    assertCameraNear(selectedPerspective, perspective, "Organization selection");

    const otherActions = await evaluate(cdp, `Object.fromEntries([...document.querySelectorAll('[data-organization-action]')].map((action) => [action.dataset.organizationAction, { available: action.tagName === 'A', disabled: action.getAttribute('aria-disabled') === 'true', href: action.getAttribute('href') }]))`);
    assert.equal(otherActions["manage-profile"].disabled, true);
    assert.equal(otherActions["view-resources"].disabled, true);
    assert.equal(otherActions["start-referral"].href, `/referrals?organization=${encodeURIComponent(externalOrganizationIds.harbor)}`);
    assert.equal(otherActions["opportunities-rfx"].disabled, true);
    const internalCopyAbsent = await evaluate(cdp, `(() => {
      const text = document.body.innerText;
      return ${JSON.stringify([
        "Exact public location in",
        "Approximate public location in",
        "locality presence; exact location is private",
        "privacyTreatment",
        "coordinateSource",
        "provider projection",
        "participant projection",
        "lifecycle state",
        "Loading RFxchange",
        "Preparing this page",
      ])}.every((phrase) => !text.includes(phrase));
    })()`);
    assert.equal(internalCopyAbsent, true, "Participant detail exposed prohibited internal copy.");

    await evaluate(cdp, `document.querySelector('#organization-detail-panel button')?.click()`);
    await waitForExpression(cdp, `!document.querySelector('#organization-detail-panel')`, "closed organization detail");
    await waitForCameraPadding(cdp, "left", "restored left-side padding");
    const closedPerspective = await cameraSnapshotFromDom(cdp);
    assert.equal(closedPerspective.viewMode, "perspective");
    assertCameraNear(closedPerspective, selectedPerspective, "Detail close");
    assert.ok(selectedPerspective.padding[1] > selectedPerspective.padding[3], "Detail overlay did not apply right-side camera padding.");
    assert.ok(closedPerspective.padding[3] > closedPerspective.padding[1], "Closed detail did not restore left-side camera padding.");

    const lensSnapshots = [];
    let referralRecipientCarryForward = false;
    for (const [lens, route] of [["resources", "/resources"], ["referrals", "/referrals"], ["intelligence", "/geography/canvas"]]) {
      await clickLens(cdp, lens, route);
      await waitForExpression(
        cdp,
        `(() => { const scene = document.querySelector('[data-map-ready="true"]'); return scene?.dataset.mapViewMode === 'perspective' && Math.abs(Number(scene.dataset.mapPitch) - 35) < 1 && scene.dataset.selectedMarkerId === ${JSON.stringify(harborMarkerId)}; })()`,
        `${lens} Perspective and Organization B continuity`,
        45_000,
      );
      const snapshot = await cameraSnapshotFromDom(cdp);
      assertCameraNear(snapshot, selectedPerspective, `${lens} lens`);
      lensSnapshots.push({ lens, ...snapshot });
      if (lens === "referrals") {
        await evaluate(cdp, `document.querySelector('aside header button')?.click()`);
        await waitForExpression(cdp, `Boolean(document.querySelector('[role="dialog"] select'))`, "referral composer selected recipient");
        referralRecipientCarryForward = await evaluate(cdp, `document.querySelector('[role="dialog"] select')?.value === ${JSON.stringify(externalOrganizationIds.harbor)}`);
        assert.equal(referralRecipientCarryForward, true, "Referral composer did not retain Organization B.");
        await evaluate(cdp, `document.querySelector('[role="dialog"] button[aria-label]')?.click()`);
        await waitForExpression(cdp, `!document.querySelector('[role="dialog"]')`, "closed referral composer");
      }
    }

    const flat = await chooseMapView(cdp, "2D", 0);
    assert.ok(Math.abs(flat.bearing) < 1, `2D bearing was ${flat.bearing}.`);
    const threeDimensional = await chooseMapView(cdp, "3D", 75);
    assert.ok(Math.abs(threeDimensional.pitch - 75) < 1);

    await evaluate(cdp, `(() => { const button = [...document.querySelectorAll('[role="group"][aria-label="Map view"] button')].find((candidate) => candidate.textContent?.trim() === 'Fit home'); button?.click(); })()`);
    await waitForExpression(cdp, `Number(document.querySelector('[data-map-ready="true"]')?.dataset.mapZoom) < 13`, "home-locality fit before cluster zoom");
    const canvasPoint = await evaluate(cdp, `(() => { const canvas = document.querySelector('[data-map-ready="true"] canvas'); const rect = canvas?.getBoundingClientRect(); return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null; })()`);
    assert.ok(canvasPoint, "Map canvas was unavailable for cluster zoom acceptance.");
    for (let index = 0; index < 8; index += 1) {
      const previousZoom = Number(await evaluate(cdp, `document.querySelector('[data-map-ready="true"]')?.dataset.mapZoom`));
      if (previousZoom < 9.5) break;
      assert.equal(
        await evaluate(cdp, `(() => { const button = document.querySelector('.mapboxgl-ctrl-zoom-out'); button?.click(); return Boolean(button); })()`),
        true,
        "Mapbox zoom-out control was unavailable.",
      );
      await waitForExpression(
        cdp,
        `Number(document.querySelector('[data-map-ready="true"]')?.dataset.mapZoom) < ${JSON.stringify(previousZoom - 0.4)}`,
        `settled cluster zoom-out ${index + 1}`,
      );
    }
    await waitForExpression(cdp, `Number(document.querySelector('[data-map-ready="true"]')?.dataset.mapZoom) < 10`, "wide cluster zoom");
    await waitForExpression(
      cdp,
      `(() => { const scene = document.querySelector('[data-map-ready="true"]'); return Number(scene?.dataset.renderedClusterCount) >= 1 && Boolean(scene?.dataset.renderedClusterPoint); })()`,
      "rendered external organization cluster and click target",
    );
    await wait(1_000);
    const clustered = await cameraSnapshotFromDom(cdp);
    assert.equal(clustered.selectedMarkerId, harborMarkerId);
    assert.equal(clustered.selectedStandingCount, 1, "Selected organization disappeared into a cluster.");
    let expanded = clustered;
    for (let attempt = 0; attempt < 3 && expanded.zoom <= clustered.zoom + 0.4; attempt += 1) {
      await waitForExpression(
        cdp,
        `Boolean(document.querySelector('[data-map-ready="true"]')?.dataset.renderedClusterPoint)`,
        `cluster click target ${attempt + 1}`,
      );
      const currentCluster = await cameraSnapshotFromDom(cdp);
      const [clusterX, clusterY] = currentCluster.clusterPoint.split(",").map(Number);
      const canvasRect = await evaluate(cdp, `(() => { const rect = document.querySelector('[data-map-ready="true"] canvas')?.getBoundingClientRect(); return rect ? { left: rect.left, top: rect.top } : null; })()`);
      assert.ok(canvasRect && Number.isFinite(clusterX) && Number.isFinite(clusterY));
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: canvasRect.left + clusterX, y: canvasRect.top + clusterY, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: canvasRect.left + clusterX, y: canvasRect.top + clusterY, button: "left", clickCount: 1 });
      await wait(2_000);
      expanded = await cameraSnapshotFromDom(cdp);
    }
    assert.ok(expanded.zoom > clustered.zoom + 0.4, `Cluster did not expand from zoom ${clustered.zoom}; final zoom ${expanded.zoom}.`);
    assert.equal(expanded.selectedMarkerId, harborMarkerId);

    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));
    cdp.close();
    return {
      initial,
      perspective,
      selectedOrganizationId: externalOrganizationIds.harbor,
      selectedPerspective,
      lensSnapshots,
      flat,
      threeDimensional,
      cluster: { beforeExpansion: clustered, afterExpansion: expanded },
      actionStates: { own: ownActions, other: otherActions },
      organizationIdentityFallback: selectedPerspective.selectedMarkerIdentity,
      markerListSynchronization: true,
      resultDrawer: { desktopEdgeSheetOpened: true, closedWithoutCameraReset: true },
      referralRecipientCarryForward,
      internalCopyAbsent,
      desktopAccountAvatar,
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
  } finally {
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
  }
}

function controlledLifecycleForUser(userId) {
  const journeyId = `activation-${userId}`;
  let lifecycle = createAccessLifecycle({ id: journeyId, now });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
  lifecycle = associateAccessJourneyWithUser(lifecycle, userId, now);
  for (const state of [
    "account-activated",
    "geography-selected",
    "organization-resolved",
    "organization-registered",
    "organization-activated",
    "controlled-platform",
  ]) lifecycle = advanceAccessLifecycle(lifecycle, state, now);
  return lifecycle;
}

async function runLifecycleAcceptance({ baseUrl, sessionCookie, seed }) {
  const lifecycleRef = db.collection("accessJourneys").doc(`activation-${seed.userId}`);
  const originalLifecycle = await lifecycleRef.get();
  assert.equal(originalLifecycle.exists, true, "Open lifecycle fixture was missing.");
  const controlled = controlledLifecycleForUser(seed.userId);
  const orientationRepository = new FirestoreOrientationJourneyRepository(db);
  const orientationService = new OrientationJourneyService({
    journeys: orientationRepository,
    ids: { event: () => `orientation-event-${runId}-${randomBytes(3).toString("hex")}` },
    now: () => now,
  });
  const scope = {
    userId: seed.userId,
    accessJourneyId: controlled.id,
    organizationId,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
  };
  let chrome;
  try {
    chrome = await launchChrome(9306);
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await lifecycleRef.set(record(controlled));
    await cdp.send("Page.navigate", { url: `${baseUrl}/resources` });
    await waitForExpression(cdp, `location.pathname === "/orientation"`, "orientation-incomplete redirect");

    await orientationService.start(scope);
    for (const step of ORIENTATION_STEP_SEQUENCE) await orientationService.completeStep(scope, step.key);
    await cdp.send("Page.navigate", { url: `${baseUrl}/resources` });
    await waitForExpression(cdp, `location.pathname === "/first-value"`, "orientation-complete first-value redirect");

    await lifecycleRef.set(originalLifecycle.data());
    await cdp.send("Page.navigate", { url: `${baseUrl}/resources` });
    await waitForExpression(
      cdp,
      `location.pathname === "/resources" && Boolean(document.querySelector('[data-participant-navigation]'))`,
      "fully released requested Exchange lens",
    );
    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));
    cdp.close();
    return {
      orientationIncompleteDestination: "/orientation",
      orientationCompleteFirstValueIncompleteDestination: "/first-value",
      fullyReleasedDestination: "/resources",
      completedTutorialReplayed: false,
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
  } finally {
    if (originalLifecycle.exists) await lifecycleRef.set(originalLifecycle.data());
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
  }
}

async function runMobileAndLocales({ server, baseUrl, sessionCookie }) {
  let chrome;
  try {
    chrome = await launchChrome(9303);
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(cdp, `${baseUrl}/geography/canvas`);
    const mobile = await evaluate(cdp, `(() => {
      const summary = document.querySelector('[data-participant-navigation] details > summary');
      const account = document.querySelector('[data-participant-utility="account"] > button');
      const avatar = account?.firstElementChild;
      const accountRect = account?.getBoundingClientRect();
      const avatarRect = avatar?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        menuVisible: Boolean(summary && getComputedStyle(summary).display !== 'none'),
        accountVisible: Boolean(account && getComputedStyle(account).display !== 'none'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        accountAvatar: accountRect && avatarRect ? {
          hitWidth: accountRect.width,
          hitHeight: accountRect.height,
          avatarWidth: avatarRect.width,
          avatarHeight: avatarRect.height,
        } : null,
      };
    })()`);
    assert.ok(mobile.overflow <= 0, `390px overflow: ${mobile.overflow}px.`);
    assert.equal(mobile.menuVisible, true);
    assert.equal(mobile.accountVisible, true);
    assert.equal(mobile.reducedMotion, true);
    assert.ok(mobile.accountAvatar?.hitWidth >= 44 && mobile.accountAvatar?.hitHeight >= 44);
    assert.ok(mobile.accountAvatar?.avatarWidth >= 30 && mobile.accountAvatar?.avatarWidth <= 36);
    let spatialSheet = null;
    if (configuredMapAcceptance) {
      await waitForExpression(cdp, `Boolean(document.querySelector('[data-map-ready="true"]'))`, "mobile configured map");
      spatialSheet = await evaluate(cdp, `(() => {
        const scene = document.querySelector('[data-map-ready="true"]');
        const panel = document.querySelector('#organization-detail-panel')?.parentElement;
        const sceneRect = scene?.getBoundingClientRect();
        const panelRect = panel?.getBoundingClientRect();
        return sceneRect && panelRect ? {
          mapVisible: sceneRect.width > 300 && sceneRect.height > 500,
          bottomGap: window.innerHeight - panelRect.bottom,
          sheetWidth: panelRect.width,
          sheetTop: panelRect.top,
        } : null;
      })()`);
      assert.ok(spatialSheet?.mapVisible, "Mobile bottom sheet obscured or removed the map.");
      assert.ok(spatialSheet.bottomGap <= 10, `Mobile sheet was not bottom-anchored (${spatialSheet.bottomGap}px).`);
      assert.ok(spatialSheet.sheetWidth <= 374, `Mobile sheet exceeded viewport-safe width (${spatialSheet.sheetWidth}px).`);
      assert.ok(spatialSheet.sheetTop > 100, `Mobile sheet behaved like a page takeover (${spatialSheet.sheetTop}px).`);
    }

    await evaluate(cdp, `document.querySelector('[data-participant-navigation] details > summary')?.click()`);
    const unavailable = await waitForExpression(cdp, `(() => {
      const item = document.querySelector('[data-participant-navigation] details [data-participant-lens="opportunities-rfx"]');
      return item ? { text: item.textContent, disabled: item.getAttribute('aria-disabled') } : null;
    })()`, "mobile unavailable lens");
    assert.equal(unavailable.disabled, "true");
    assert.match(unavailable.text, /available/i);

    const keyboard = await evaluate(cdp, `(async () => {
      const button = document.querySelector('[data-participant-utility="account"] > button');
      button.focus();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const menu = document.querySelector('[role="menu"]');
      const firstFocused = document.activeElement === menu?.querySelector('[role="menuitem"]');
      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        firstFocused,
        menuDismissed: !document.querySelector('[role="menu"]'),
        focusRestored: document.activeElement === button,
      };
    })()`);
    assert.deepEqual(keyboard, { firstFocused: true, menuDismissed: true, focusRestored: true });

    await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
    await wait(300);
    assert.equal(
      await evaluate(cdp, `Boolean(document.querySelector('[role="menu"] a[href="/admin"]'))`),
      false,
      "Administration remained visible after server authority was removed.",
    );

    const localeExpectations = {
      "en-US": "Not yet available",
      es: "Aún no disponible",
      fr: "Pas encore disponible",
      it: "Non ancora disponibile",
      de: "Noch nicht verfügbar",
    };
    for (const [locale, unavailableText] of Object.entries(localeExpectations)) {
      await cdp.send("Network.setCookie", {
        name: localeCookieName,
        value: locale,
        url: baseUrl,
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      });
      await cdp.send("Page.reload", { ignoreCache: true });
      await waitForExpression(
        cdp,
        `document.readyState === "complete"
          && document.documentElement.lang === "${locale}"
          && Boolean(document.querySelector('[data-participant-authorized="true"] [data-participant-navigation]'))`,
        `${locale} authorized participant navigation`,
      );
      const labels = await evaluate(cdp, `(() => {
        const item = document.querySelector('[data-participant-navigation] [data-participant-lens="opportunities-rfx"]');
        return { label: item?.getAttribute('aria-label'), text: item?.textContent || '' };
      })()`);
      assert.equal(labels.label, "Opportunities/RFx");
      assert.ok(labels.text.includes(unavailableText), `${locale} silently fell back: ${labels.text}`);
    }

    const finalDiagnostics = await evaluate(cdp, `window.__rfxAcceptance.errors`);
    assert.equal(finalDiagnostics.length, 0, finalDiagnostics.join("\n"));
    assert.equal(diagnostics.consoleErrors.length, 0, diagnostics.consoleErrors.join("\n"));
    assert.equal(diagnostics.exceptions.length, 0, diagnostics.exceptions.join("\n"));
    cdp.close();
    return {
      width: 390,
      overflowPx: mobile.overflow,
      reducedMotion: mobile.reducedMotion,
      accountAvatar: mobile.accountAvatar,
      accountKeyboard: keyboard,
      spatialSheet,
      locales: Object.keys(localeExpectations),
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
  } finally {
    if (chrome) {
      await stopProcess(chrome.child);
      await rm(chrome.profile, { recursive: true, force: true });
    }
    await stopProcess(server);
  }
}

let seed;
let candidateServer;
try {
  seed = await seedParticipant();
  const baseline = await runBaseline({
    cwd: baselineWorktree,
    port: 3101,
    sessionCookie: seed.sessionCookie,
  });
  const candidateRun = await runCandidate({
    cwd: process.cwd(),
    port: 3100,
    sessionCookie: seed.sessionCookie,
  });
  candidateServer = candidateRun.server;
  const spatial = configuredMapAcceptance
    ? await runSpatialAcceptance({
        baseUrl: candidateRun.baseUrl,
        sessionCookie: seed.sessionCookie,
      })
    : null;
  const lifecycle = await runLifecycleAcceptance({
    baseUrl: candidateRun.baseUrl,
    sessionCookie: seed.sessionCookie,
    seed,
  });
  const authorizationAndAliasBoundaries = await runAuthorizationAndAliasBoundaries({
    baseUrl: candidateRun.baseUrl,
    sessionCookie: seed.sessionCookie,
  });
  await removeAdministrativeAccess(seed);
  const mobileAndLocales = await runMobileAndLocales({
    server: candidateRun.server,
    baseUrl: candidateRun.baseUrl,
    sessionCookie: seed.sessionCookie,
  });
  const serverLogTimings = summarizedLoggedServerTimings(candidateRun.server);
  const acceptanceChecklist = Object.freeze({
    candidateSha,
    startingSha: baselineSha,
    routeChain: ["Intelligence", "Resources", "Referrals", "Intelligence", "Account", "Quick Start"],
    documentNavigationCount: candidateRun.result.fullDocumentNavigationCount,
    shellRemountCount: candidateRun.result.shellRemounts,
    loadingScreenOccurrenceCount: candidateRun.result.rootTakeoverObserved ? 1 : 0,
    orientationReplayCount: candidateRun.result.activationReplayObserved ? 1 : 0,
    lifecycleRouteAssertions: lifecycle,
    mapViewPerLens: spatial?.lensSnapshots ?? null,
    actualPitchPerView: spatial ? {
      initial3d: spatial.initial.pitch,
      perspective: spatial.perspective.pitch,
      flat2d: spatial.flat.pitch,
      restored3d: spatial.threeDimensional.pitch,
    } : null,
    cameraBeforeAfterTransitions: spatial?.lensSnapshots ?? null,
    selectedObjectBeforeAfter: spatial ? {
      organizationId: spatial.selectedOrganizationId,
      before: spatial.selectedPerspective.selectedMarkerId,
      after: spatial.lensSnapshots.at(-1)?.selectedMarkerId ?? null,
    } : null,
    standingMarkerState: spatial ? { selectedMarkerId: spatial.selectedPerspective.selectedMarkerId } : null,
    compactMarkerState: spatial ? { externalMarkerCount: spatial.initial.markerCount, selectedStandingCount: spatial.cluster.beforeExpansion.selectedStandingCount } : null,
    clusterState: spatial?.cluster ?? null,
    organizationIdentityFallback: spatial?.organizationIdentityFallback ?? null,
    markerListSynchronization: spatial?.markerListSynchronization ?? false,
    resultDrawerState: spatial?.resultDrawer ?? null,
    searchFilterPreservation: candidateRun.result.intelligenceContextPreserved,
    ownOrganizationActionResults: spatial?.actionStates.own ?? null,
    externalOrganizationActionResults: spatial?.actionStates.other ?? null,
    resourcesAvailabilityState: spatial?.actionStates.other["view-resources"] ?? null,
    referralRecipientCarryForward: spatial?.referralRecipientCarryForward ?? false,
    internalCopyAbsent: spatial?.internalCopyAbsent ?? false,
    accountAvatar: spatial ? { desktop: spatial.desktopAccountAvatar, mobile: mobileAndLocales.accountAvatar } : null,
    desktop: spatial !== null,
    mobile390: mobileAndLocales.spatialSheet,
    keyboard: mobileAndLocales.accountKeyboard,
    reducedMotion: mobileAndLocales.reducedMotion,
    fiveLocales: mobileAndLocales.locales,
    consoleErrors: [
      ...candidateRun.result.consoleErrors,
      ...(spatial?.consoleErrors ?? []),
      ...lifecycle.consoleErrors,
      ...authorizationAndAliasBoundaries.consoleErrors,
      ...mobileAndLocales.consoleErrors,
    ],
    unhandledExceptions: [
      ...candidateRun.result.exceptions,
      ...(spatial?.exceptions ?? []),
      ...lifecycle.exceptions,
      ...authorizationAndAliasBoundaries.exceptions,
      ...mobileAndLocales.exceptions,
    ],
  });
  if (configuredMapAcceptance) {
    assert.equal(Object.values(acceptanceChecklist).some((value) => value === null || value === false), false, "Configured evidence checklist is incomplete.");
  }

  const evidence = {
    result: "passed",
    runId,
    projectId,
    sequence: [
      "Intelligence",
      "Resources",
      "Referrals",
      "Intelligence",
      "Account",
      "Quick Start",
    ],
    benchmarkLatencyMs: 450,
    baseline,
    candidate: candidateRun.result,
    spatial,
    lifecycle,
    authorizationAndAliasBoundaries,
    mobileAndLocales,
    serverLogTimings,
    acceptanceChecklist,
    interpretation: {
      timingsAreRepresentative: true,
      productionNetworkPromise: false,
      transitionTimingMetric: "interaction-to-route-commit",
      contentSettlementReportedSeparately: true,
      removedBlockingWork: [
        "page-local participant shell recreation",
        "root page-wide participant loading takeover",
        "duplicate shell session and organization hydration",
        "Account-critical-path administrative access resolution",
        "sequential independent Resources projections",
      ],
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log("Exchange shell configured-browser acceptance passed.");
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await stopProcess(candidateServer);
  try {
    if (seed?.providerUid) await adminAuth.deleteUser(seed.providerUid);
  } catch {
    // Emulator teardown is authoritative cleanup.
  }
  await deleteAdminApp(adminApp);
}
