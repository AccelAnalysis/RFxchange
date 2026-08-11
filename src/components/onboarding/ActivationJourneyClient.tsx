"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ActivationJourneyState, ActivationJourneyStep } from "../../application/onboarding/activation-journey";
import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  ORGANIZATION_CAPABILITY_CATEGORIES,
  type OrganizationCapabilityCategory,
} from "../../domain/organization-profile/model";
import {
  ORGANIZATION_RELATIONSHIPS,
  type OrganizationRelationship,
} from "../../domain/onboarding/model";
import {
  MapboxLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "../map/MapboxLocalityCanvas";
import { useI18n } from "../i18n/I18nProvider";
import { BrandWordmark } from "../brand/BrandWordmark";
import {
  createClientAuthenticationLifecycle,
  createClientAuthenticationProvider,
} from "../../infrastructure/auth/firebase-client";
import { clearParticipantIntelligenceContext } from "../../application/participant/intelligence-context-storage";

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

const RELATIONSHIP_LABELS = Object.freeze({
  owner: "Owner",
  "executive-officer": "Executive / officer",
  employee: "Employee",
  "authorized-representative": "Authorized representative",
  "advisor-contractor": "Advisor / contractor",
  other: "Other",
} satisfies Record<OrganizationRelationship, string>);

const CAPABILITY_CATEGORY_LABELS = Object.freeze({
  "professional-business-services": "Professional and business services",
  "construction-skilled-trades": "Construction and skilled trades",
  "manufacturing-fabrication": "Manufacturing and fabrication",
  "technology-data-cybersecurity": "Technology, data and cybersecurity",
  "transportation-logistics": "Transportation and logistics",
  "marketing-creative-services": "Marketing and creative services",
  "facilities-real-estate": "Facilities and real estate",
  "education-workforce-training": "Education and workforce training",
  "health-safety-security": "Health, safety and security",
  "food-hospitality-events": "Food, hospitality and events",
  other: "Other",
} satisfies Record<OrganizationCapabilityCategory, string>);

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

function effectiveStep(state: ActivationJourneyState): ActivationJourneyStep {
  if (state.nextStep === "organization" && !state.emailVerified) return "email-verification";
  return state.nextStep;
}

function geographyTypeLabel(type: string): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivationJourneyClient({
  mapModel,
  onStateChange,
}: Readonly<{
  mapModel: ControlledLocalityMapModel;
  onStateChange?: (state: ActivationJourneyState | null) => void;
}>) {
  const { t } = useI18n();
  const [state, setState] = useState<ActivationJourneyState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "signin">("register");
  const [needsActivationSetup, setNeedsActivationSetup] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [userName, setUserName] = useState("");
  const [organizationRelationship, setOrganizationRelationship] = useState<OrganizationRelationship>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalChecks, setLegalChecks] = useState({ terms: false, rules: false, privacy: false });
  const [localityQuery, setLocalityQuery] = useState("");
  const [localityStateCode, setLocalityStateCode] = useState("VA");
  const [geographyCandidates, setGeographyCandidates] = useState<readonly GeographyCandidate[]>([]);
  const [geographySearching, setGeographySearching] = useState(false);
  const [activeGeographyIndex, setActiveGeographyIndex] = useState(-1);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [organizationWebsite, setOrganizationWebsite] = useState("");
  const [websiteNotApplicable, setWebsiteNotApplicable] = useState(false);
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [searchCandidates, setSearchCandidates] = useState<readonly SearchCandidate[]>([]);
  const [creationAllowed, setCreationAllowed] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationCandidates, setLocationCandidates] = useState<readonly LocationCandidate[]>([]);
  const [selectedLocationCandidateId, setSelectedLocationCandidateId] = useState<string | null>(null);
  const [capabilityCategory, setCapabilityCategory] = useState<OrganizationCapabilityCategory>(
    "professional-business-services",
  );

  const step = state ? effectiveStep(state) : null;

  const applyState = useCallback((nextState: ActivationJourneyState) => {
    setState(nextState);
    setOrganizationName(nextState.organization?.displayName ?? nextState.provisionalOrganizationName);
    setOrganizationWebsite(nextState.profileSeed.websiteUrl ?? "");
    setWebsiteNotApplicable(nextState.profileSeed.websiteDisposition === "not-applicable");
    setOrganizationPhone(nextState.profileSeed.phone ?? "");
    setUserName(nextState.profileSeed.contactName);
    setEmail(nextState.profileSeed.contactEmail);
  }, []);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding/activation", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { state: ActivationJourneyState };
      })
      .then((result) => {
        if (!cancelled && result?.state) applyState(result.state);
        if (
          !cancelled &&
          !result?.state &&
          new URLSearchParams(window.location.search).get("begin") === "1" &&
          createClientAuthenticationProvider().currentPrincipal()
        ) {
          setNeedsActivationSetup(true);
          setAuthMode("signin");
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  useEffect(() => {
    if (step !== "geography") return;
    const query = localityQuery.trim();
    const stateCode = localityStateCode.trim();
    if (query.length < 2 || stateCode.length !== 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setGeographySearching(true);
      void jsonRequest<{ candidates: readonly GeographyCandidate[] }>(
        "/api/onboarding/activation",
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            action: "search-geographies",
            query,
            stateCode,
          }),
        },
      )
        .then((result) => {
          setGeographyCandidates(result.candidates);
          setActiveGeographyIndex(result.candidates.length ? 0 : -1);
        })
        .catch((caught) => {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
          setError(caught instanceof Error ? caught.message : "Locality suggestions are unavailable.");
          setGeographyCandidates([]);
          setActiveGeographyIndex(-1);
        })
        .finally(() => setGeographySearching(false));
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [localityQuery, localityStateCode, step]);

  const locationOverlay = useMemo<readonly ControlledLocalityPointOverlay[]>(() => {
    const candidate = locationCandidates.find(
      (entry) => entry.id === selectedLocationCandidateId,
    );
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
  }, [locationCandidates, selectedLocationCandidateId]);

  async function run<T>(task: () => Promise<T>): Promise<void> {
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
    provisionalOrganizationName = "",
    requestedName?: string,
    relationship?: OrganizationRelationship,
  ) {
    const auth = createClientAuthenticationProvider();
    const idToken = await auth.getIdToken(true);
    if (!idToken) throw new Error("Firebase sign-in did not produce an ID token.");
    const csrf = await jsonRequest<{ csrfToken: string }>("/api/auth/session");
    const result = await jsonRequest<{ state: ActivationJourneyState | null }>("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({
        idToken,
        csrfToken: csrf.csrfToken,
        ...(provisionalOrganizationName.trim()
          ? { provisionalOrganizationName }
          : {}),
        ...(requestedName?.trim() ? { requestedName } : {}),
        ...(relationship ? { organizationRelationship: relationship } : {}),
      }),
    });
    if (result.state) applyState(result.state);
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
    applyState(result.state);
    return result.state;
  }

  async function chooseGeography(geography: GeographyCandidate) {
    const result = await postAction<{ state: ActivationJourneyState }>(
      "select-census-geography",
      { reference: geography.reference },
    );
    applyState(result.state);
    setGeographyCandidates([]);
  }

  const currentIndex = step ? JOURNEY_STEPS.findIndex((item) => item.key === step) : -1;
  const activeGeography = activeGeographyIndex >= 0
    ? geographyCandidates[activeGeographyIndex] ?? null
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandWordmark compact />
        {state || needsActivationSetup ? (
          <button
            className={styles.textButton}
            type="button"
            disabled={busy}
            onClick={() => run(async () => {
              clearParticipantIntelligenceContext();
              try {
                await createClientAuthenticationProvider().signOut();
              } catch {
                // Server-session invalidation must still run if client-provider teardown is unavailable.
              }
              await fetch("/api/auth/session", { method: "DELETE" });
              setState(null);
              setNeedsActivationSetup(false);
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

        {state?.acquisitionContext ? (
          <aside className={styles.acquisitionNotice} aria-label="Saved arrival context">
            <strong>We saved what brought you here.</strong>
            <span>
              Your {state.acquisitionContext.kind.replaceAll("-", " ")} context will be waiting
              after activation. It does not change any participation or authority requirement.
            </span>
          </aside>
        ) : null}

        {error ? <div className={styles.error} role="alert">{error}</div> : null}

        {!state && needsActivationSetup ? (
          <section className={styles.card} aria-labelledby="begin-setup-title">
            <p className={styles.stepLabel}>Signed in</p>
            <h2 id="begin-setup-title">Begin organization setup.</h2>
            <p>Your account is authenticated. Tell us which organization you are joining on behalf of.</p>
            <form className={styles.form} onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!organizationName.trim()) throw new Error("Organization name is required.");
                const nextState = await exchangeSession(
                  organizationName,
                  undefined,
                  organizationRelationship,
                );
                if (!nextState) throw new Error("Organization setup could not be started.");
                setNeedsActivationSetup(false);
              });
            }}>
              <label>Organization name<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required /></label>
              <label>
                Your relationship with this organization
                <select value={organizationRelationship} onChange={(event) => setOrganizationRelationship(event.target.value as OrganizationRelationship)} required>
                  {ORGANIZATION_RELATIONSHIPS.map((relationship) => (
                    <option key={relationship} value={relationship}>{RELATIONSHIP_LABELS[relationship]}</option>
                  ))}
                </select>
                <small>This describes your relationship; it does not grant account authority.</small>
              </label>
              <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Starting…" : "Begin setup"}</button>
            </form>
          </section>
        ) : null}

        {!state && !needsActivationSetup ? (
          <section className={styles.card} aria-labelledby="account-title">
            <div className={styles.modeSwitch} role="group" aria-label="Account action">
              <button type="button" data-active={authMode === "register"} onClick={() => setAuthMode("register")}>Register</button>
              <button type="button" data-active={authMode === "signin"} onClick={() => setAuthMode("signin")}>Sign in</button>
            </div>
            <h2 id="account-title">{authMode === "register" ? "Create the organization account" : "Sign in and continue"}</h2>
            <form className={styles.form} onSubmit={(event) => {
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
                  const nextState = await exchangeSession();
                  if (!nextState) setNeedsActivationSetup(true);
                }
              });
            }}>
              {authMode === "register" ? (
                <>
                  <label>Organization name<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required /></label>
                  <label>
                    Your relationship with this organization
                    <select value={organizationRelationship} onChange={(event) => setOrganizationRelationship(event.target.value as OrganizationRelationship)} required>
                      {ORGANIZATION_RELATIONSHIPS.map((relationship) => (
                        <option key={relationship} value={relationship}>{RELATIONSHIP_LABELS[relationship]}</option>
                      ))}
                    </select>
                    <small>This describes your relationship; it does not grant account authority.</small>
                  </label>
                  <label>Your name<input value={userName} onChange={(event) => setUserName(event.target.value)} required /></label>
                </>
              ) : null}
              <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label>Password<input type="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Working…" : authMode === "register" ? "Create account" : "Sign in"}</button>
            </form>
          </section>
        ) : null}

        {state && step === "legal" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Account active</p>
            <h2>Accept the participation policies.</h2>
            <p>Review the current published policies before continuing.</p>
            <div className={styles.checkList}>
              <label><input type="checkbox" checked={legalChecks.terms} onChange={(event) => setLegalChecks((value) => ({ ...value, terms: event.target.checked }))} /><span>I accept the current RFxchange <Link className={styles.policyLink} href="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>.</span></label>
              <label><input type="checkbox" checked={legalChecks.rules} onChange={(event) => setLegalChecks((value) => ({ ...value, rules: event.target.checked }))} /><span>I agree to the <Link className={styles.policyLink} href="/platform-rules" target="_blank" rel="noreferrer">Platform Rules / conduct requirements</Link>.</span></label>
              <label><input type="checkbox" checked={legalChecks.privacy} onChange={(event) => setLegalChecks((value) => ({ ...value, privacy: event.target.checked }))} /><span>I acknowledge the <Link className={styles.policyLink} href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span></label>
            </div>
            <button className={styles.primary} disabled={busy || !legalChecks.terms || !legalChecks.rules || !legalChecks.privacy} onClick={() => run(async () => {
              const result = await postAction<{ state: ActivationJourneyState }>("accept-legal");
              applyState(result.state);
            })}>Continue</button>
          </section>
        ) : null}

        {state && step === "geography" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Home locality</p>
            <h2>Where is {state.provisionalOrganizationName} primarily based?</h2>
            <p>Begin typing a city, county, or locality. Census-authoritative suggestions appear as you type and are resolved again on the server after selection.</p>
            <div className={styles.form}>
              <div className={styles.twoColumn}>
                <label>
                  City, county, or locality
                  <input
                    value={localityQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setLocalityQuery(nextQuery);
                      if (nextQuery.trim().length < 2) {
                        setGeographyCandidates([]);
                        setActiveGeographyIndex(-1);
                        setGeographySearching(false);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setActiveGeographyIndex((index) => Math.min(index + 1, geographyCandidates.length - 1));
                      } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setActiveGeographyIndex((index) => Math.max(index - 1, 0));
                      } else if (event.key === "Enter" && activeGeography) {
                        event.preventDefault();
                        void run(() => chooseGeography(activeGeography));
                      } else if (event.key === "Escape") {
                        setGeographyCandidates([]);
                        setActiveGeographyIndex(-1);
                      }
                    }}
                    minLength={2}
                    placeholder="Portsmouth, Richmond, Fairfax…"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={geographyCandidates.length > 0}
                    aria-controls="locality-suggestions"
                    aria-activedescendant={activeGeography ? `locality-${activeGeography.fipsCode}` : undefined}
                    autoComplete="off"
                    required
                  />
                  <small>{geographySearching ? "Finding Census localities…" : "Suggestions update as you type."}</small>
                </label>
                <label>State <small>Two-letter code</small><input value={localityStateCode} onChange={(event) => {
                  const nextStateCode = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
                  setLocalityStateCode(nextStateCode);
                  if (nextStateCode.length !== 2) {
                    setGeographyCandidates([]);
                    setActiveGeographyIndex(-1);
                    setGeographySearching(false);
                  }
                }} minLength={2} maxLength={2} placeholder="VA" required /></label>
              </div>
            </div>
            {geographyCandidates.length ? (
              <div className={styles.results} id="locality-suggestions" role="listbox" aria-label="Locality suggestions">
                {geographyCandidates.map((geography, index) => (
                  <article
                    key={geography.reference}
                    id={`locality-${geography.fipsCode}`}
                    className={styles.resultCard}
                    role="option"
                    aria-selected={index === activeGeographyIndex}
                    aria-disabled={busy}
                    data-active={index === activeGeographyIndex}
                    onMouseEnter={() => setActiveGeographyIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (!busy) void run(() => chooseGeography(geography));
                    }}
                  >
                    <div>
                      <strong>{geography.name}, {geography.stateName}</strong>
                      <span>{geographyTypeLabel(geography.type)} · FIPS {geography.fipsCode}</span>
                    </div>
                    <span className={styles.secondary} aria-hidden="true">Use this locality</span>
                  </article>
                ))}
              </div>
            ) : localityQuery.trim().length >= 2 && !geographySearching ? (
              <p className={styles.hint}>No matching Census locality found.</p>
            ) : null}
          </section>
        ) : null}

        {state && step === "orientation" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Canonical orientation position</p>
            <h2>Learn the network inside {state.selectedGeography?.name}.</h2>
            <p>The full interactive orientation is implemented in Slices 2.10 and 2.11. Continuing here preserves its required runtime position without marking education complete.</p>
            <button className={styles.primary} disabled={busy} onClick={() => run(async () => {
              const result = await postAction<{ state: ActivationJourneyState }>("acknowledge-orientation-position");
              applyState(result.state);
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
                const refreshedSession = await exchangeSession();
                if (!refreshedSession?.emailVerified) {
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
              <label>Organization name<input value={organizationName || state.provisionalOrganizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label>
              <div className={styles.twoColumn}>
                <label>
                  Organization website
                  <small>Used for matching and carried into the organization profile.</small>
                  <input type="text" inputMode="url" placeholder="example.com" value={organizationWebsite} disabled={websiteNotApplicable} onChange={(event) => setOrganizationWebsite(event.target.value)} />
                </label>
                <label>Organization phone <small>Optional matching signal; carried forward.</small><input value={organizationPhone} onChange={(event) => setOrganizationPhone(event.target.value)} /></label>
              </div>
              <label className={styles.inlineCheck}><input type="checkbox" checked={websiteNotApplicable} onChange={(event) => {
                setWebsiteNotApplicable(event.target.checked);
                if (event.target.checked) setOrganizationWebsite("");
              }} />This organization does not have a public website</label>
              <button className={styles.primary} disabled={busy || (!websiteNotApplicable && !organizationWebsite.trim())} onClick={() => run(async () => {
                const result = await postAction<{ candidates: readonly SearchCandidate[]; creationSafety: { allowed: boolean } }>("search-organizations", {
                  displayName: organizationName || state.provisionalOrganizationName,
                  website: organizationWebsite,
                  websiteNotApplicable,
                  phone: organizationPhone,
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
                      const result = await postAction<{ state: ActivationJourneyState }>("select-existing-organization", {
                        displayName: organizationName || state.provisionalOrganizationName,
                        organizationId: candidate.organizationId,
                        domainEmailReference: createClientAuthenticationProvider().currentPrincipal()?.email ?? undefined,
                      });
                      applyState(result.state);
                    })}>This is my organization</button>
                  </article>
                ))}
                <button className={styles.primary} disabled={busy || !creationAllowed} onClick={() => run(async () => {
                  const result = await postAction<{ state: ActivationJourneyState }>("create-organization", {
                    displayName: organizationName || state.provisionalOrganizationName,
                    website: organizationWebsite,
                    websiteNotApplicable,
                    phone: organizationPhone,
                    reviewedCandidateOrganizationIds: searchCandidates.map((candidate) => candidate.organizationId),
                  });
                  applyState(result.state);
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
            <p>Selecting an existing profile never grants control. Activation resumes after legitimate evidence or administrator review establishes the relationship.</p>
            <button className={styles.secondary} disabled={busy} onClick={() => run(async () => { await refreshState(); })}>Check authority status</button>
          </section>
        ) : null}

        {state && step === "location" ? (
          <section className={styles.card}>
            <p className={styles.stepLabel}>Confirmed organization location</p>
            <h2>Place {state.organization?.displayName ?? state.provisionalOrganizationName} in {state.selectedGeography?.name}.</h2>
            <p>Your confirmed home locality becomes the initial service geography for minimum activation. Service territory can be expanded after activation.</p>
            {locationCandidates.length ? (
              <>
                <div className={styles.mapFrame}>
                  <MapboxLocalityCanvas model={mapModel} initialZoom="locality" pointOverlays={locationOverlay} />
                </div>
                <div className={styles.results}>
                  {locationCandidates.map((candidate) => (
                    <article
                      className={styles.resultCard}
                      data-active={selectedLocationCandidateId === candidate.id}
                      key={candidate.id}
                    >
                      <div><strong>{candidate.matchedAddress}</strong><span>{candidate.provider} · {candidate.quality}</span></div>
                      {selectedLocationCandidateId === candidate.id ? (
                        <button className={styles.primary} disabled={busy} type="button" onClick={() => run(async () => {
                          const result = await postAction<{ state: ActivationJourneyState }>("confirm-location", { candidateId: selectedLocationCandidateId });
                          applyState(result.state);
                          setLocationCandidates([]);
                          setSelectedLocationCandidateId(null);
                        })}>{t("mapStabilization.confirmCandidate")}</button>
                      ) : (
                        <button
                          className={styles.secondary}
                          disabled={busy}
                          type="button"
                          onClick={() => setSelectedLocationCandidateId(candidate.id)}
                        >
                          {t("mapStabilization.plotCandidate")}
                        </button>
                      )}
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
                  applyState(result.state);
                  setLocationCandidates(result.draft.candidates);
                  setSelectedLocationCandidateId(result.draft.candidates[0]?.id ?? null);
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
            <h2>Complete the information needed for useful network discovery.</h2>
            <div className={styles.notice} role="status">
              <strong>{state.organization?.displayName ?? state.provisionalOrganizationName}</strong>
              <div>Website: {state.profileSeed.websiteDisposition === "not-applicable" ? "No public website" : state.profileSeed.websiteUrl ?? "Not yet confirmed"}</div>
              <div>Contact: {state.profileSeed.contactName} · {state.profileSeed.contactEmail}</div>
              {state.profileSeed.phone ? <div>Phone: {state.profileSeed.phone}</div> : null}
            </div>
            <form className={styles.form} onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(async () => {
                const result = await postAction<{ state: ActivationJourneyState }>("save-profile", {
                  ...(state.profileSeed.websiteDisposition === null
                    ? {
                        website: data.get("website"),
                        websiteNotApplicable: data.get("websiteNotApplicable") === "on",
                      }
                    : {}),
                  contactRole: data.get("contactRole"),
                  contactPubliclyVisible: data.get("contactPubliclyVisible") === "on",
                  capabilityKind: data.get("capabilityKind"),
                  capabilityCategory: data.get("capabilityCategory"),
                  capabilityOtherCategory: data.get("capabilityOtherCategory"),
                  capabilityName: data.get("capabilityName"),
                  capabilityDescription: data.get("capabilityDescription"),
                });
                applyState(result.state);
              });
            }}>
              {state.profileSeed.websiteDisposition === null ? (
                <fieldset>
                  <legend>Website confirmation</legend>
                  <label>Organization website<input name="website" type="text" inputMode="url" placeholder="example.com" /></label>
                  <label className={styles.inlineCheck}><input name="websiteNotApplicable" type="checkbox" />This organization does not have a public website</label>
                </fieldset>
              ) : null}
              <label>Contact role<input name="contactRole" placeholder="Owner, President, Operations Director…" required /></label>
              <label className={styles.inlineCheck}><input name="contactPubliclyVisible" type="checkbox" />Show this organization contact publicly</label>
              <fieldset>
                <legend>Meaningful capability</legend>
                <label>Capability type<select name="capabilityKind" defaultValue="service"><option value="service">Service provided</option><option value="product">Product supplied</option><option value="function">Function performed</option></select></label>
                <label>
                  Capability category
                  <select name="capabilityCategory" value={capabilityCategory} onChange={(event) => setCapabilityCategory(event.target.value as OrganizationCapabilityCategory)} required>
                    {ORGANIZATION_CAPABILITY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{CAPABILITY_CATEGORY_LABELS[category]}</option>
                    ))}
                  </select>
                </label>
                {capabilityCategory === "other" ? <label>Other category<input name="capabilityOtherCategory" required /></label> : null}
                <label>Specific capability<input name="capabilityName" placeholder="Precision marine metal fabrication" required /></label>
                <label>Plain-language description<textarea name="capabilityDescription" minLength={20} required /></label>
              </fieldset>
              <p className={styles.hint}>Every activated organization can both issue and respond to opportunities. Official Resource Provider status is requested separately after activation.</p>
              <button className={styles.primary} type="submit" disabled={busy}>Complete profile and activate marker</button>
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
            <h2>Your organization is ready.</h2>
            <p>{state.organization?.displayName} now has an active marker in {state.selectedGeography?.name}. Welcome to the RFxchange.</p>
            {state.controlledPlatformUrl ? (
              state.acquisitionContext ? (
                <Link className={styles.primaryLink} href={state.controlledPlatformUrl}>Continue where you left off</Link>
              ) : (
                <Link className={styles.primaryLink} href={state.controlledPlatformUrl}>Enter the Exchange</Link>
              )
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
