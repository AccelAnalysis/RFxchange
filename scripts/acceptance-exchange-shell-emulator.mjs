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
import {
  createPlatformAdministratorAuthorityContext,
  createPlatformAdministratorRoleConfiguration,
} from "../src/domain/admin-authorization/model.ts";
import { createPlatformAdministratorAccount } from "../src/domain/admin-authorization/administrator-lifecycle.ts";
import { createOrganizationUserAuthorization } from "../src/domain/organization-authorization/model.ts";
import {
  createHomeGeographyAuthorization,
  createHomeGeographySelection,
} from "../src/domain/geography-selection/model.ts";
import { initializeOrganizationLifecycle } from "../src/domain/lifecycle/model.ts";
import {
  createOrganizationLocation,
  createOrganizationServiceGeography,
} from "../src/domain/organization-location/model.ts";
import { createActivationContext } from "../src/domain/onboarding/model.ts";
import {
  createOrganizationProfile,
  createOrganizationProfileCompletion,
} from "../src/domain/organization-profile/model.ts";
import {
  createOrganization,
  createOrganizationMembership,
} from "../src/domain/organizations/model.ts";
import { createUser } from "../src/domain/users/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/infrastructure/geography/controlled-locality-seed.ts";
import { createFirestoreGeographyRepositories } from "../src/infrastructure/geography/firestore-repository.ts";
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
  || "87fb29ef3b442410deecf61a470bc94c9c013c60";
const candidateSha = process.env.RFXCHANGE_ACCEPTANCE_CANDIDATE_SHA?.trim() || "unknown";
const outputPath = path.resolve(
  process.env.RFXCHANGE_ACCEPTANCE_OUTPUT?.trim()
    || "artifacts/exchange-shell-transition-evidence.json",
);

assert.ok(authEmulatorHost, "FIREBASE_AUTH_EMULATOR_HOST is required.");
assert.ok(firestoreEmulatorHost, "FIRESTORE_EMULATOR_HOST is required.");
assert.ok(baselineWorktree, "RFXCHANGE_ACCEPTANCE_BASE_WORKTREE is required.");

const runId = `shell-${Date.now()}-${randomBytes(3).toString("hex")}`;
const now = new Date().toISOString();
const organizationId = `org-${runId}`;
const membershipId = `membership-${runId}`;
const authorizationId = `organization-authorization-${membershipId}`;
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

async function seedParticipant() {
  const providerUser = await adminAuth.createUser({
    email,
    emailVerified: true,
    password,
    displayName: "Configured Shell Actor",
    disabled: false,
  });
  const userId = userIdForFirebaseSubject(providerUser.uid);
  const user = createUser({
    id: userId,
    displayName: "Configured Shell Actor",
    email,
    provider: "firebase",
    subject: providerUser.uid,
    termsVersion: "2026-08-01",
    now,
  });
  const organization = createOrganization({
    id: organizationId,
    name: displayName,
    legalName: `${displayName}, LLC`,
    createdByUserId: user.id,
    now,
  });
  const profile = createOrganizationProfile({
    id: `profile-${runId}`,
    organizationId: organization.id,
    displayName,
    industry: "Professional services",
    capability: {
      id: `capability-${runId}`,
      category: "professional-services",
      name: "Configured browser acceptance",
    },
    website: "https://example.test",
    organizationType: "private-sector",
    description: "Configured acceptance organization for persistent-shell validation.",
    sizeBand: "1-10",
    geographicMarkets: [PORTSMOUTH_CONTROLLED_LOCALITY.name],
    now,
  });
  const membership = createOrganizationMembership({
    id: membershipId,
    userId: user.id,
    organizationId: organization.id,
    membershipRole: "owner",
    createdByUserId: user.id,
    now,
  });
  const authorization = createOrganizationUserAuthorization({
    id: authorizationId,
    organizationId: organization.id,
    userId: user.id,
    membershipId: membership.id,
    roleKey: "organization-owner",
    status: "active",
    permissions: [
      "organization.profile.manage",
      "organization.member.manage",
      "organization.claim.manage",
      "organization.location.manage",
      "organization.data.manage",
      "organization.provider.apply",
      "rfx.create",
    ],
    createdByUserId: user.id,
    now,
  });
  const lifecycle = initializeOrganizationLifecycle({
    organizationId: organization.id,
    acceptedByUserId: user.id,
    legalAcceptanceId: `legal-${runId}`,
    activationId: `activation-${runId}`,
    now,
  });
  const activationContext = createActivationContext({
    userId: user.id,
    capturedAt: now,
  });
  const homeSelection = createHomeGeographySelection({
    userId: user.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    geographyType: PORTSMOUTH_CONTROLLED_LOCALITY.type,
    fipsCode: PORTSMOUTH_CONTROLLED_LOCALITY.fipsCode,
    selectedAt: now,
  });
  const homeAuthorization = createHomeGeographyAuthorization({
    userId: user.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    geographyType: PORTSMOUTH_CONTROLLED_LOCALITY.type,
    fipsCode: PORTSMOUTH_CONTROLLED_LOCALITY.fipsCode,
    sourceSelectionId: homeSelection.id,
    authorizedAt: now,
  });
  const location = createOrganizationLocation({
    organizationId: organization.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    latitude: 36.8354,
    longitude: -76.2983,
    formattedAddress: "801 Crawford Street, Portsmouth, VA 23704",
    address: {
      streetLine1: "801 Crawford Street",
      city: "Portsmouth",
      stateCode: "VA",
      postalCode: "23704",
      countryCode: "US",
    },
    visibility: "exact",
    selectedByUserId: user.id,
    now,
  });
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: organization.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    geographyType: PORTSMOUTH_CONTROLLED_LOCALITY.type,
    source: "home-locality",
    selectedByUserId: user.id,
    now,
  });
  const completion = createOrganizationProfileCompletion({
    organizationId: organization.id,
    profile,
    location,
    capabilitiesComplete: true,
    requiredPoliciesAccepted: true,
    now,
  });
  const markerActivation = Object.freeze({
    id: String(organization.id),
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

  await createFirestoreGeographyRepositories(db).definitions.save(PORTSMOUTH_CONTROLLED_LOCALITY);
  await Promise.all([
    db.collection("users").doc(String(user.id)).set(record(user)),
    db.collection("organizations").doc(String(organization.id)).set(record(organization)),
    db.collection("organizationProfiles").doc(String(profile.id)).set(record(profile)),
    db.collection("organizationMemberships").doc(String(membership.id)).set(record(membership)),
    db.collection("organizationUserAuthorizations").doc(String(authorization.id)).set(record(authorization)),
    db.collection("activationContexts").doc(String(user.id)).set(record(activationContext)),
    db.collection("accessJourneys").doc(String(lifecycle.id)).set(record(lifecycle)),
    db.collection("homeGeographySelections").doc(String(user.id)).set(record(homeSelection)),
    db.collection("homeGeographyAuthorizations").doc(String(user.id)).set(record(homeAuthorization)),
    db.collection("organizationLocations").doc(String(organization.id)).set(record(location)),
    db.collection("organizationServiceGeographies").doc(String(serviceGeography.id)).set(record(serviceGeography)),
    db.collection("organizationProfileCompletions").doc(String(organization.id)).set(record(completion)),
    db.collection("organizationMarkerActivations").doc(String(organization.id)).set(record(markerActivation)),
  ]);

  const administratorId = `administrator-${runId}`;
  const account = createPlatformAdministratorAccount({
    administratorId,
    subject: providerUser.uid,
    state: "active",
    roleKey: "member-success-support-administrator",
    displayName: "Configured Shell Administrator",
    email,
    mfaRequired: false,
    breakGlass: false,
    now,
  });
  const roleConfiguration = createPlatformAdministratorRoleConfiguration({
    administratorId,
    roleKey: "member-success-support-administrator",
    grantedByAdministratorId: administratorId,
    now,
  });
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId,
    roleConfiguration,
    now,
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
  const child = spawn(
    "npm",
    ["run", "start", "--", "-H", "127.0.0.1", "-p", String(port)],
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
  const child = spawn(binary, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
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
  ], { stdio: "ignore" });
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
    diagnostics.exceptions.push(exceptionDetails?.text ?? "Runtime exception");
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
      window.__rfxAcceptance = { errors: [], transitions: [], takeover: false, scopedLoading: false };
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
    name: "rfx_locale",
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
    state.scopedLoading = false;
    state.transitionStartedAt = performance.now();
    state.observer?.disconnect?.();
    state.observer = new MutationObserver(() => {
      const text = document.body?.textContent || "";
      if (text.includes("Preparing this page") || text.includes("Loading RFxchange")) state.takeover = true;
      if (document.querySelector("[data-participant-content-loading]")) state.scopedLoading = true;
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
      scopedLoading: state.scopedLoading,
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
    return {
      found: true,
      shellVisible: Boolean(header && getComputedStyle(header).display !== "none"),
      pending: link.getAttribute("aria-busy") === "true" || link.dataset.pending === "true",
      currentText: document.body.textContent || "",
    };
  })()`);
  assert.equal(immediate.found, true, `Missing navigation link ${href}.`);
  if (candidate) {
    assert.equal(immediate.shellVisible, true, `Shell disappeared after clicking ${href}.`);
    assert.equal(immediate.pending, true, `No immediate pending feedback for ${href}.`);
    assert.equal(immediate.currentText.includes("Preparing this page"), false);
  }
  await waitForExpression(cdp, `location.pathname === "${expectedPath}"`, expectedPath);
  const observation = await finishObservation(cdp);
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
  await evaluate(cdp, `document.querySelector('[data-participant-utility="account"] > button')?.click()`);
  await waitForExpression(cdp, `Boolean(document.querySelector('[role="menu"] a[href="${href}"]'))`, href);
  return clickHref(cdp, href, expectedPath, { candidate });
}

function percentile(values, quantile) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantile));
  return Number(sorted[index].toFixed(1));
}

async function runBaseline({ cwd, port, sessionCookie }) {
  const server = startServer(cwd, port, "baseline");
  let chrome;
  try {
    await waitForHttp(`http://127.0.0.1:${port}/`, server);
    chrome = await launchChrome(9301);
    const baseUrl = `http://127.0.0.1:${port}`;
    const { cdp, diagnostics } = await createPage(chrome, baseUrl, sessionCookie);
    await navigate(cdp, `${baseUrl}/geography/canvas?query=shell-acceptance&selectedOrganization=${organizationId}`);
    let token = await ensureShellToken(cdp);
    let remounts = 0;
    const observations = [];
    for (const [href, route] of [
      ["/resources", "/resources"],
      ["/referrals", "/referrals"],
      ["/geography/canvas", "/geography/canvas"],
      ["/organization-profile", "/organization-profile"],
      ["/quick-start", "/quick-start"],
    ]) {
      observations.push(await clickHref(cdp, href, route));
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
    observations.push(await clickUtility(cdp, "/organization-profile", "/organization-profile", true));
    observations.push(await clickUtility(cdp, "/quick-start", "/quick-start", true));

    const finalState = await evaluate(cdp, `(() => ({
      shellInstance: document.querySelector('[data-participant-shell="persistent"]')?.dataset.participantShellInstance || null,
      navigationEntries: performance.getEntriesByType("navigation").length,
      transitions: window.__rfxAcceptance.transitions,
      errors: window.__rfxAcceptance.errors,
      takeoverText: (document.body.textContent || '').includes('Preparing this page'),
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
    assert.equal(observations[0].scopedLoading, true, "Delayed Resources transition never exposed scoped content loading.");
    assert.equal(observations.every((item) => item.navigationEntries === 1), true);

    const durations = observations.map((item) => item.durationMs);
    const result = {
      sha: candidateSha,
      observations,
      medianTransitionMs: percentile(durations, 0.5),
      p90TransitionMs: percentile(durations, 0.9),
      persistentShellInstance: initialShell,
      transitionEvents: finalState.transitions,
      documentRequests: diagnostics.documentRequests,
      serverTiming: diagnostics.serverTiming,
      consoleErrors: diagnostics.consoleErrors,
      exceptions: diagnostics.exceptions,
    };
    cdp.close();
    return { result, server, baseUrl };
  } catch (error) {
    await stopProcess(server);
    throw error;
  } finally {
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
    await navigate(cdp, `${baseUrl}/resources`);
    const mobile = await evaluate(cdp, `(() => {
      const summary = document.querySelector('[data-participant-navigation] details > summary');
      const account = document.querySelector('[data-participant-utility="account"] > button');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        menuVisible: Boolean(summary && getComputedStyle(summary).display !== 'none'),
        accountVisible: Boolean(account && getComputedStyle(account).display !== 'none'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    })()`);
    assert.ok(mobile.overflow <= 0, `390px overflow: ${mobile.overflow}px.`);
    assert.equal(mobile.menuVisible, true);
    assert.equal(mobile.accountVisible, true);
    assert.equal(mobile.reducedMotion, true);

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
        name: "rfx_locale",
        value: locale,
        url: baseUrl,
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      });
      await cdp.send("Page.reload", { ignoreCache: true });
      await waitForExpression(cdp, `document.readyState === "complete" && document.documentElement.lang === "${locale}"`, `${locale} locale`);
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
      accountKeyboard: keyboard,
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
  await removeAdministrativeAccess(seed);
  const mobileAndLocales = await runMobileAndLocales({
    server: candidateRun.server,
    baseUrl: candidateRun.baseUrl,
    sessionCookie: seed.sessionCookie,
  });

  const evidence = {
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
    baseline,
    candidate: candidateRun.result,
    mobileAndLocales,
    interpretation: {
      timingsAreRepresentative: true,
      productionNetworkPromise: false,
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
  try {
    if (seed?.providerUid) await adminAuth.deleteUser(seed.providerUid);
  } catch {
    // Emulator teardown is authoritative cleanup.
  }
  await deleteAdminApp(adminApp);
}
