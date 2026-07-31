"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ActivationJourneyState, ActivationJourneyStep } from "../../application/onboarding/activation-journey";
import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  MapboxLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "../map/MapboxLocalityCanvas";
import { BrandWordmark } from "../brand/BrandWordmark";
import {
  createClientAuthenticationLifecycle,
  createClientAuthenticationProvider,
} from "../../infrastructure/auth/firebase-client";

import styles from "./ActivationJourneyClient.module.css";

type SearchCandidate = Readonly<{
  organizationId: string;
  displayName: string;
  classification: string;
  score: number;
  evidence?: readonly Readonly<{ explanation: string }>[];
}>;

type LocationCandidate = Readonly<{
  id: string;
  coordinate: readonly [number, number];
  matchedAddress: string;
  quality: string;
  provider: string;
}>;

const JOURNEY_STEPS: readonly Readonly<{ key: ActivationJourneyStep; label: string }>[] = [
  { key: "legal", label: "Policies" },
  { key: "geography", label: "Home locality" },
  { key: "orientation", label: "Orientation" },
  { key: "email-verification", label: "Verify email" },
  { key: "organization", label: "Organization" },
  { key: "authority-review", label: "Authority" },
  { key: "location", label: "Location" },
  { key: "profile", label: "Essential profile" },
  { key: "marker", label: "Marker" },
  { key: "complete", label: "Activated" },
];

const ROLE_OPTIONS = ["business", "supplier", "buyer", "issuer", "resource-provider"] as const;
const OBJECTIVE_OPTIONS = [
  ["find-opportunities", "Find opportunities"],
  ["issue-opportunities", "Issue opportunities"],
  ["find-customers", "Find customers"],
  ["find-suppliers", "Find suppliers"],
  ["find-teammates", "Find teammates"],
  ["find-resources-support", "Find resources and support"],
  ["explore-local-network", "Explore the local network"],
] as const;

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error ?? `Request failed with HTTP ${response.status}.`);
  return body;
}

function toggle(values: readonly string[], value: string): readonly string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function effectiveStep(state: ActivationJourneyState): ActivationJourneyStep {
  if (state.nextStep === "organization" && !state.emailVerified) return "email-verification";
  return state.nextStep;
}

export function ActivationJourneyClient({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [state, setState] = useState<ActivationJourneyState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "signin">("register");
  const [organizationName, setOrganizationName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalChecks, setLegalChecks] = useState({ terms: false, rules: false, privacy: false });
  const [orgDomain, setOrgDomain] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [searchCandidates, setSearchCandidates] = useState<readonly SearchCandidate[]>([]);
  const [creationAllowed, setCreationAllowed] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationCandidates, setLocationCandidates] = useState<readonly LocationCandidate[]>([]);
  const [roles, setRoles] = useState<readonly string[]>(["business"]);
  const [objectives, setObjectives] = useState<readonly string[]>(["explore-local-network"]);

  const step = state ? effectiveStep(state) : null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding/activation", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { state: ActivationJourneyState };
      })
      .then((result) => {
        if (!cancelled && result?.state) {
          setState(result.state);
          setOrganizationName(result.state.provisionalOrganizationName);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const locationOverlay = useMemo<readonly ControlledLocalityPointOverlay[]>(() => {
    const candidate = locationCandidates[0];
    return candidate
      ? [
          {
            id: candidate.id,
            position: candidate.coordinate,
            label: candidate.matchedAddress,
            kind: "location-candidate",
            privacyLabel: "Private activation location candidate awaiting confirmation.",
          },
        ]
      : [];
  }, [locationCandidates]);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Activation request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exchangeSession(provisionalOrganizationName: string, requestedName?: string) {
    const auth = createClientAuthenticationProvider();
    const idToken = await auth.getIdToken(true);
    if (!idToken) throw new Error("Firebase sign-in did not produce an ID token.");
    const csrf = await jsonRequest<{ csrfToken: string }>("/api/auth/session");
    const result = await jsonRequest<{ state: ActivationJourneyState }>("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({
        idToken,
        csrfToken: csrf.csrfToken,
        provisionalOrganizationName,
        requestedName,
      }),
    });
    setState(result.state);
    setOrganizationName(result.state.provisionalOrganizationName);
  }

  async function postAction<T extends object = { state: ActivationJourneyState }>(
    action: string,
    payload: Readonly<Record<string, unknown>> = {},
  ): Promise<T> {
    return jsonRequest<T>("/api/onboarding/activation", {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
    });
  }

  async function refreshState() {
    const result = await postAction<{ state: ActivationJourneyState }>("refresh");
    setState(result.state);
    return result.state;
  }

  const currentIndex = step ? JOURNEY_STEPS.findIndex((item) => item.key === step) : -1;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandWordmark compact />
        {state ? (
          <button
            className={styles.textButton}
            type="button"
            disabled={busy}
            onClick={() => run(async () => {
              await createClientAuthenticationProvider().signOut().catch(() => undefined);
              await fetch("/api/auth/session", { method: "DELETE" });
              setState(null);
              setAuthMode("signin");
            })}
          >
            Sign out
          </button>
        ) : null}
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Organization activation</p>
          <h1>Put your organization on the Exchange map.</h1>
          <p>
            Create the first user, establish the organization in its home locality, confirm the
            real location, complete the minimum profile, and activate the real marker.
          </p>
        </div>

        {state ? (
          <ol className={styles.progress} aria-label="Activation journey progress">
            {JOURNEY_STEPS.map((item, index) => (
              <li key={item.key} data-current={index === currentIndex} data-complete={index < currentIndex}>
                <span>{index + 1}</span>{item.label}
              </li>
            ))}
          </ol>
        ) : null}

        {error ? <div className={styles.error} role="alert">{error}</div> : null}

        {!state ? (
          <section className={styles.card} aria-labelledby="account-title">
            <div className={styles.modeSwitch} role="group" aria-label="Account action">
              <button type="button" data-active={authMode === "register"} onClick={() => setAuthMode("register")}>Register</button>
              <button type="button" data-active={authMode === "signin"} onClick={() => setAuthMode("signin")}>Sign in</button>
            </div>
            <h2 id="account-title">{authMode === "register" ? "Create the organization account" : "Sign in and continue"}</h2>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const auth = createClientAuthenticationProvider();
                  if (authMode === "register") {
                    if (!organizationName.trim()) throw new Error("Organization name is required.");
                    if (!userName.trim()) throw new Error("Your name is required.");
                    await auth.registerWithEmailAndPassword(email, password);
                    setAuthMode("signin");
                    await createClientAuthenticationLifecycle()
                      .sendVerificationEmail(`${window.location.origin}/join`)
                      .catch(() => undefined);
                    await exchangeSession(organizationName, userName);
                  } else {
                    await auth.signInWithEmailAndPassword(email, password);
                    await exchangeSession(organizationName, userName || undefined);
                  }
                });
              }}
            >
              {authMode === "register" ? (
                <label>Organization name<input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required /></label>
              ) : (
                <label>Organization name <small>Only needed if this Firebase account has not begun activation before.</small><input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} /></label>
              )}
              <label>Your name<input value={userName} onChange={(e) => setUserName(e.target.value)} required={authMode === "register"} /></label>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label>Password<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
              <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Working…" : authMode === "register" ? "Create account" : "Sign in"}</button>
            </form>
          </section>
        ) : null}

        {state && step === "legal" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Account active</p>
            <h2>Accept the participation policies.</h2>
            <p>
              This integration gate captures the required acceptance position now. Canonical
              versioned legal acknowledgements remain subject to the published Terms, Platform
              Rules, and Privacy Policy and will be rechecked by the OPEN gate.
            </p>
            <div className={styles.checkList}>
              <label><input type="checkbox" checked={legalChecks.terms} onChange={(e) => setLegalChecks((v) => ({ ...v, terms: e.target.checked }))} />I accept the current RFxchange Terms of Service.</label>
              <label><input type="checkbox" checked={legalChecks.rules} onChange={(e) => setLegalChecks((v) => ({ ...v, rules: e.target.checked }))} />I agree to the Platform Rules / conduct requirements.</label>
              <label><input type="checkbox" checked={legalChecks.privacy} onChange={(e) => setLegalChecks((v) => ({ ...v, privacy: e.target.checked }))} />I acknowledge the Privacy Policy.</label>
            </div>
            <button className={styles.primary} disabled={busy || !legalChecks.terms || !legalChecks.rules || !legalChecks.privacy} onClick={() => run(async () => {
              const result = await postAction("accept-legal");
              setState(result.state);
            })}>Continue</button>
          </section>
        ) : null}

        {state && step === "geography" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Home locality</p>
            <h2>Where is {state.provisionalOrganizationName} primarily based?</h2>
            <p>The selection is validated server-side. Map navigation never changes this authority.</p>
            <div className={styles.choiceGrid}>
              {state.releasedGeographies.map((geography) => (
                <button key={geography.id} className={styles.choiceCard} type="button" disabled={busy} onClick={() => run(async () => {
                  const result = await postAction("select-geography", { geographyId: geography.id });
                  setState(result.state);
                })}>
                  <strong>{geography.name}</strong><span>{geography.type}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {state && step === "orientation" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Canonical orientation position</p>
            <h2>Learn the network inside {state.selectedGeography?.name}.</h2>
            <p>
              The full three-organization interactive orientation is implemented in Slices 2.10
              and 2.11. This bridge preserves its required runtime position before organization
              resolution; continuing here does <strong>not</strong> mark any EDU feature complete
              and cannot satisfy the future OPEN education gate.
            </p>
            <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
              const result = await postAction("acknowledge-orientation-position");
              setState(result.state);
            })}>Continue activation setup</button>
          </section>
        ) : null}

        {state && step === "email-verification" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Identity security</p>
            <h2>Verify your email before establishing organization authority.</h2>
            <p>We stop here before creating or claiming an organization so a verification failure cannot leave a half-created organization relationship.</p>
            <div className={styles.actionRow}>
              <button className={styles.secondary} disabled={busy} onClick={() => run(async () => {
                await createClientAuthenticationLifecycle().sendVerificationEmail(`${window.location.origin}/join`);
              })}>Send verification email</button>
              <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
                await createClientAuthenticationLifecycle().reloadCurrentPrincipal();
                await refreshState();
              })}>I verified — continue</button>
            </div>
          </section>
        ) : null}

        {state && step === "organization" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Find · claim · create</p>
            <h2>Resolve {state.provisionalOrganizationName}.</h2>
            <div className={styles.form}>
              <label>Organization name<input value={organizationName || state.provisionalOrganizationName} onChange={(e) => setOrganizationName(e.target.value)} /></label>
              <div className={styles.twoColumn}>
                <label>Website domain <small>Optional matching signal</small><input placeholder="example.com" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} /></label>
                <label>Phone <small>Optional matching signal</small><input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} /></label>
              </div>
              <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
                const result = await postAction<{ candidates: readonly SearchCandidate[]; creationSafety: { allowed: boolean } }>("search-organizations", {
                  displayName: organizationName || state.provisionalOrganizationName,
                  domain: orgDomain,
                  phone: orgPhone,
                });
                setSearchCandidates(result.candidates);
                setCreationAllowed(result.creationSafety.allowed);
                setHasSearched(true);
              })}>Find organization</button>
            </div>
            {hasSearched ? (
              <div className={styles.results}>
                <h3>{searchCandidates.length ? "Possible matches" : "No existing match found"}</h3>
                {searchCandidates.map((candidate) => (
                  <article key={candidate.organizationId} className={styles.resultCard}>
                    <div><strong>{candidate.displayName}</strong><span>{candidate.classification}</span></div>
                    <button className={styles.secondary} disabled={busy} onClick={() => run(async () => {
                      const result = await postAction("select-existing-organization", {
                        displayName: organizationName || state.provisionalOrganizationName,
                        organizationId: candidate.organizationId,
                        domainEmailReference: createClientAuthenticationProvider().currentPrincipal()?.email ?? undefined,
                      });
                      setState(result.state);
                    })}>This is my organization</button>
                  </article>
                ))}
                <button className={styles.primary} disabled={busy || !creationAllowed} onClick={() => run(async () => {
                  const result = await postAction("create-organization", {
                    displayName: organizationName || state.provisionalOrganizationName,
                    domain: orgDomain,
                    phone: orgPhone,
                    reviewedCandidateOrganizationIds: searchCandidates.map((candidate) => candidate.organizationId),
                  });
                  setState(result.state);
                })}>None of these — create this organization</button>
                {!creationAllowed ? <p className={styles.hint}>A strong possible match must be resolved before a duplicate organization can be created.</p> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {state && step === "authority-review" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Authority pending</p>
            <h2>Management authority must be established for this existing organization.</h2>
            <p>
              Selecting an existing profile never grants control. The authority claim has been
              submitted and must be supported by legitimate evidence or administrator review.
              Activation resumes after that relationship becomes authorized.
            </p>
            <button className={styles.secondary} disabled={busy} onClick={() => run(async () => { await refreshState(); })}>Check authority status</button>
          </section>
        ) : null}

        {state && step === "location" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Confirmed organization location</p>
            <h2>Place {state.organization?.displayName ?? state.provisionalOrganizationName} in {state.selectedGeography?.name}.</h2>
            {locationCandidates.length ? (
              <>
                <div className={styles.mapFrame}>
                  <MapboxLocalityCanvas model={mapModel} initialZoom="locality" pointOverlays={locationOverlay} />
                </div>
                <div className={styles.results}>
                  {locationCandidates.map((candidate) => (
                    <article className={styles.resultCard} key={candidate.id}>
                      <div><strong>{candidate.matchedAddress}</strong><span>{candidate.provider} · {candidate.quality}</span></div>
                      <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
                        const result = await postAction("confirm-location", { candidateId: candidate.id });
                        setState(result.state);
                        setLocationCandidates([]);
                      })}>Confirm this map position</button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <form className={styles.form} onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void run(async () => {
                  const result = await postAction<{ state: ActivationJourneyState; draft: { candidates: readonly LocationCandidate[] } }>("begin-location", {
                    addressLine1: data.get("addressLine1"),
                    addressLine2: data.get("addressLine2"),
                    locality: data.get("locality"),
                    regionCode: data.get("regionCode"),
                    postalCode: data.get("postalCode"),
                    isHomeOrPrivate: data.get("isHomeOrPrivate") === "on",
                    visibility: data.get("visibility"),
                  });
                  setState(result.state);
                  setLocationCandidates(result.draft.candidates);
                });
              }}>
                <label>Street address<input name="addressLine1" required /></label>
                <label>Address line 2<input name="addressLine2" /></label>
                <div className={styles.threeColumn}>
                  <label>City<input name="locality" defaultValue={state.selectedGeography?.name ?? ""} required /></label>
                  <label>State<input name="regionCode" defaultValue="VA" maxLength={2} required /></label>
                  <label>ZIP<input name="postalCode" required /></label>
                </div>
                <label className={styles.inlineCheck}><input name="isHomeOrPrivate" type="checkbox" />This is a home or private address</label>
                <label>Public map precision<select name="visibility" defaultValue="locality-only"><option value="locality-only">Locality only</option><option value="approximate">Approximate</option><option value="exact">Exact</option></select></label>
                <button className={styles.primary} type="submit" disabled={busy}>Find this location</button>
              </form>
            )}
          </section>
        ) : null}

        {state && step === "profile" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Essential registration</p>
            <h2>Give the network enough information to make a useful connection.</h2>
            <form className={styles.form} onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(async () => {
                const result = await postAction("save-profile", {
                  displayName: data.get("displayName"),
                  organizationType: data.get("organizationType"),
                  website: data.get("website"),
                  websiteNotApplicable: data.get("websiteNotApplicable") === "on",
                  contactName: data.get("contactName"),
                  contactRole: data.get("contactRole"),
                  contactEmail: data.get("contactEmail"),
                  contactPhone: data.get("contactPhone"),
                  contactPubliclyVisible: data.get("contactPubliclyVisible") === "on",
                  capabilityKind: data.get("capabilityKind"),
                  capabilityName: data.get("capabilityName"),
                  capabilityDescription: data.get("capabilityDescription"),
                  participationRoles: roles,
                  businessObjectives: objectives,
                });
                setState(result.state);
              });
            }}>
              <label>Organization name<input name="displayName" defaultValue={state.organization?.displayName ?? state.provisionalOrganizationName} required /></label>
              <div className={styles.twoColumn}>
                <label>Organization type<select name="organizationType" defaultValue="for-profit-business"><option value="for-profit-business">For-profit business</option><option value="government-entity">Government entity</option><option value="nonprofit-organization">Nonprofit organization</option><option value="educational-institution">Educational institution</option><option value="other">Other</option></select></label>
                <label>Website<input name="website" type="url" placeholder="https://example.com" /></label>
              </div>
              <label className={styles.inlineCheck}><input name="websiteNotApplicable" type="checkbox" />Website is not applicable</label>
              <div className={styles.twoColumn}>
                <label>Main contact name<input name="contactName" defaultValue={userName} required /></label>
                <label>Contact role<input name="contactRole" placeholder="Owner, President, Operations Director…" required /></label>
              </div>
              <div className={styles.twoColumn}>
                <label>Contact email<input name="contactEmail" type="email" defaultValue={createClientAuthenticationProvider().currentPrincipal()?.email ?? email} required /></label>
                <label>Contact phone<input name="contactPhone" /></label>
              </div>
              <label className={styles.inlineCheck}><input name="contactPubliclyVisible" type="checkbox" />Show this contact publicly</label>
              <fieldset><legend>Meaningful capability</legend><label>Capability type<select name="capabilityKind" defaultValue="service"><option value="service">Service</option><option value="product">Product</option><option value="function">Function</option><option value="buying-need">Buying need</option><option value="resource-provider-function">Resource-provider function</option></select></label><label>Specific capability<input name="capabilityName" required /></label><label>Description<textarea name="capabilityDescription" minLength={20} required /></label></fieldset>
              <fieldset><legend>Participation roles</legend><div className={styles.checkGrid}>{ROLE_OPTIONS.map((role) => <label key={role}><input type="checkbox" checked={roles.includes(role)} onChange={() => setRoles((current) => toggle(current, role))} />{role.replaceAll("-", " ")}</label>)}</div></fieldset>
              <fieldset><legend>Business objectives</legend><div className={styles.checkGrid}>{OBJECTIVE_OPTIONS.map(([value, label]) => <label key={value}><input type="checkbox" checked={objectives.includes(value)} onChange={() => setObjectives((current) => toggle(current, value))} />{label}</label>)}</div></fieldset>
              <button className={styles.primary} type="submit" disabled={busy || roles.length === 0 || objectives.length === 0}>Complete profile and activate marker</button>
            </form>
          </section>
        ) : null}

        {state && step === "marker" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Marker activation</p>
            <h2>Checking the real activation gate.</h2>
            <p>Profile Complete, confirmed location, organization authority, and geography participation must all be true before a real marker can be active.</p>
            {state.profileCompletion?.missingRequirements.length ? <ul>{state.profileCompletion.missingRequirements.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            <button className={styles.secondary} disabled={busy} onClick={() => run(async () => { await refreshState(); })}>Refresh activation state</button>
          </section>
        ) : null}

        {state && step === "complete" ? (
          <section className={`${styles.card} ${styles.success}`}>
            <p className={styles.stepLabel}>Organization activated</p>
            <h2>Your real marker is active.</h2>
            <p>
              {state.organization?.displayName} now has an active marker in {state.selectedGeography?.name}.
              This completes the registration-to-marker integration gate. Full orientation and OPEN
              release remain governed by Slices 2.10–2.12.
            </p>
            {state.controlledPlatformUrl ? <Link className={styles.primaryLink} href={state.controlledPlatformUrl}>Enter the controlled Exchange</Link> : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}