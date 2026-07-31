"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ActivationJourneyState, ActivationJourneyStep } from "../../application/onboarding/activation-journey";
import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  ORGANIZATION_BUSINESS_OBJECTIVES,
  ORGANIZATION_PARTICIPATION_ROLES,
  type OrganizationBusinessObjective,
  type OrganizationParticipationRole,
} from "../../domain/organization-profile/model";
import {
  ORGANIZATION_RELATIONSHIPS,
  type OrganizationRelationship,
} from "../../domain/onboarding/model";
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

type GeographyCandidate = Readonly<{
  reference: string;
  name: string;
  stateCode: string;
  stateName: string;
  fipsCode: string;
  type: string;
  source: string;
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

const ROLE_LABELS = Object.freeze({
  business: "Business",
  supplier: "Supplier",
  buyer: "Buyer",
  issuer: "Opportunity / RFx issuer",
  government: "Government agency",
  edo: "Economic development organization",
  "resource-provider": "Resource provider",
  chamber: "Chamber / association",
  lender: "Lender / capital provider",
  university: "University / educational institution",
  nonprofit: "Nonprofit",
  other: "Other",
} satisfies Record<OrganizationParticipationRole, string>);

const OBJECTIVE_LABELS = Object.freeze({
  "find-opportunities": "Find opportunities",
  "issue-opportunities": "Issue opportunities",
  "find-customers": "Find customers",
  "find-suppliers": "Find suppliers",
  "find-teammates": "Find teammates",
  "send-receive-referrals": "Send and receive referrals",
  "find-resources-support": "Find resources and support",
  "explore-local-network": "Explore the local network",
} satisfies Record<OrganizationBusinessObjective, string>);

const RELATIONSHIP_LABELS = Object.freeze({
  owner: "Owner",
  "executive-officer": "Executive / officer",
  employee: "Employee",
  "authorized-representative": "Authorized representative",
  "advisor-contractor": "Advisor / contractor",
  other: "Other",
} satisfies Record<OrganizationRelationship, string>);

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

function toggle<T extends string>(values: readonly T[], value: T): readonly T[] {
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
  const [organizationRelationship, setOrganizationRelationship] = useState<OrganizationRelationship>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalChecks, setLegalChecks] = useState({ terms: false, rules: false, privacy: false });
  const [localityQuery, setLocalityQuery] = useState("");
  const [localityStateCode, setLocalityStateCode] = useState("VA");
  const [geographyCandidates, setGeographyCandidates] = useState<readonly GeographyCandidate[]>([]);
  const [hasSearchedGeographies, setHasSearchedGeographies] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [orgDomain, setOrgDomain] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [searchCandidates, setSearchCandidates] = useState<readonly SearchCandidate[]>([]);
  const [creationAllowed, setCreationAllowed] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationCandidates, setLocationCandidates] = useState<readonly LocationCandidate[]>([]);
  const [roles, setRoles] = useState<readonly OrganizationParticipationRole[]>(["business"]);
  const [objectives, setObjectives] = useState<readonly OrganizationBusinessObjective[]>(["explore-local-network"]);

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

  async function exchangeSession(
    provisionalOrganizationName: string,
    requestedName?: string,
    relationship?: OrganizationRelationship,
  ) {
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
        organizationRelationship: relationship,
      }),
    });
    setState(result.state);
    setOrganizationName(result.state.provisionalOrganizationName);
    return result.state;
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
                    try {
                      await createClientAuthenticationLifecycle().sendVerificationEmail(`${window.location.origin}/join`);
                      setVerificationNotice(`Verification email sent to ${email.trim()}. Open the message, verify the address, then return to this registration.`);
                    } catch {
                      setVerificationNotice("Your account was created, but the first verification message could not be sent. Continue registration and use Send verification email on the verification step.");
                    }
                    await exchangeSession(organizationName, userName, organizationRelationship);
                  } else {
                    await auth.signInWithEmailAndPassword(email, password);
                    await exchangeSession(organizationName, userName || undefined);
                  }
                });
              }}
            >
              {authMode === "register" ? (
                <>
                  <label>Organization name<input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required /></label>
                  <label>
                    Your relationship with this organization
                    <select
                      value={organizationRelationship}
                      onChange={(event) => setOrganizationRelationship(event.target.value as OrganizationRelationship)}
                      required
                    >
                      {ORGANIZATION_RELATIONSHIPS.map((relationship) => (
                        <option key={relationship} value={relationship}>{RELATIONSHIP_LABELS[relationship]}</option>
                      ))}
                    </select>
                    <small>This describes your relationship; it does not grant account authority.</small>
                  </label>
                </>
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
              Review the current published policies before accepting them. These activation
              acknowledgements preserve the required registration position; the canonical
              versioned legal gate can require renewed action when a material policy changes.
            </p>
            <div className={styles.checkList}>
              <label>
                <input type="checkbox" checked={legalChecks.terms} onChange={(e) => setLegalChecks((v) => ({ ...v, terms: e.target.checked }))} />
                <span>I accept the current RFxchange <Link className={styles.policyLink} href="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>.</span>
              </label>
              <label>
                <input type="checkbox" checked={legalChecks.rules} onChange={(e) => setLegalChecks((v) => ({ ...v, rules: e.target.checked }))} />
                <span>I agree to the <Link className={styles.policyLink} href="/platform-rules" target="_blank" rel="noreferrer">Platform Rules / conduct requirements</Link>.</span>
              </label>
              <label>
                <input type="checkbox" checked={legalChecks.privacy} onChange={(e) => setLegalChecks((v) => ({ ...v, privacy: e.target.checked }))} />
                <span>I acknowledge the <Link className={styles.policyLink} href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span>
              </label>
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
            <p>
              Search by city, county, or locality and state. Results come from U.S. Census Bureau
              TIGERweb geography and the selection is resolved again on the server before it can
              become your authoritative home locality.
            </p>
            <form className={styles.form} onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const result = await postAction<{ candidates: readonly GeographyCandidate[] }>("search-geographies", {
                  query: localityQuery,
                  stateCode: localityStateCode,
                });
                setGeographyCandidates(result.candidates);
                setHasSearchedGeographies(true);
              });
            }}>
              <div className={styles.twoColumn}>
                <label>City, county, or locality<input value={localityQuery} onChange={(event) => setLocalityQuery(event.target.value)} minLength={2} placeholder="Portsmouth, Richmond, Fairfax…" required /></label>
                <label>State <small>Two-letter code</small><input value={localityStateCode} onChange={(event) => setLocalityStateCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} minLength={2} maxLength={2} placeholder="VA" required /></label>
              </div>
              <button className={styles.primary} type="submit" disabled={busy}>Search Census localities</button>
            </form>
            {hasSearchedGeographies ? (
              <div className={styles.results}>
                <h3>{geographyCandidates.length ? "Census matches" : "No matching Census locality found"}</h3>
                {geographyCandidates.map((geography) => (
                  <article key={geography.reference} className={styles.resultCard}>
                    <div>
                      <strong>{geography.name}, {geography.stateName}</strong>
                      <span>{geography.type} · FIPS {geography.fipsCode} · {geography.source}</span>
                    </div>
                    <button className={styles.primary} type="button" disabled={busy} onClick={() => run(async () => {
                      const result = await postAction("select-census-geography", { reference: geography.reference });
                      setState(result.state);
                      window.location.reload();
                    })}>Use this home locality</button>
                  </article>
                ))}
              </div>
            ) : null}
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
            {verificationNotice ? <div className={styles.notice} role="status">{verificationNotice}</div> : null}
            <div className={styles.actionRow}>
              <button className={styles.secondary} disabled={busy} onClick={() => run(async () => {
                const principal = createClientAuthenticationProvider().currentPrincipal();
                await createClientAuthenticationLifecycle().sendVerificationEmail(`${window.location.origin}/join`);
                setVerificationNotice(`Verification email sent${principal?.email ? ` to ${principal.email}` : ""}. Open the message and click the verification link, then return here.`);
              })}>Send verification email</button>
              <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
                const principal = await createClientAuthenticationLifecycle().reloadCurrentPrincipal();
                if (!principal) throw new Error("Your sign-in session is no longer available. Sign in again to continue activation.");
                if (!principal.emailVerified) {
                  setVerificationNotice("Firebase still reports this email as unverified. Complete the verification link in the same account, then click this button again.");
                  return;
                }
                setVerificationNotice("Email verified. Refreshing your RFxchange session…");
                const refreshedSession = await exchangeSession(state.provisionalOrganizationName);
                if (!refreshedSession.emailVerified) {
                  throw new Error("Firebase verified the email, but the RFxchange session did not refresh the verified status. Sign out and sign back in, then continue.");
                }
                setVerificationNotice(null);
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
            <p>
              Your confirmed home locality becomes the initial service geography for minimum
              activation. Service territory remains a separate profile concept and can be expanded
              after activation.
            </p>
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
                  <label>State<input name="regionCode" defaultValue={localityStateCode || "VA"} maxLength={2} required /></label>
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
              <fieldset>
                <legend>Participation roles</legend>
                <div className={styles.checkGrid}>
                  {ORGANIZATION_PARTICIPATION_ROLES.map((role) => (
                    <label key={role}>
                      <input type="checkbox" checked={roles.includes(role)} onChange={() => setRoles((current) => toggle(current, role))} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Business objectives</legend>
                <div className={styles.checkGrid}>
                  {ORGANIZATION_BUSINESS_OBJECTIVES.map((objective) => (
                    <label key={objective}>
                      <input type="checkbox" checked={objectives.includes(objective)} onChange={() => setObjectives((current) => toggle(current, objective))} />
                      {OBJECTIVE_LABELS[objective]}
                    </label>
                  ))}
                </div>
              </fieldset>
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
              Organization activation is complete and the controlled Exchange is available. Full
              orientation, first-value completion, and OPEN release remain governed by Slices 2.10–2.12.
            </p>
            {state.controlledPlatformUrl ? <Link className={styles.primaryLink} href={state.controlledPlatformUrl}>Enter the controlled Exchange</Link> : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
