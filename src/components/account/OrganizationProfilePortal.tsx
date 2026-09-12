"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import styles from "./OrganizationProfilePortal.module.css";

type ProfileSectionId =
  | "overview"
  | "capabilities"
  | "credentials"
  | "locations"
  | "media"
  | "preferences";

const SECTION_IDS: readonly ProfileSectionId[] = Object.freeze([
  "overview",
  "capabilities",
  "credentials",
  "locations",
  "media",
  "preferences",
]);

export function OrganizationProfilePortal({
  ariaLabel,
  labels,
  overview,
  capabilities,
  credentials,
  locations,
  media,
  preferences,
}: Readonly<{
  ariaLabel: string;
  labels: Readonly<Record<ProfileSectionId, string>>;
  overview: ReactNode;
  capabilities: ReactNode;
  credentials: ReactNode;
  locations: ReactNode;
  media: ReactNode;
  preferences: ReactNode;
}>) {
  const [active, setActive] = useState<ProfileSectionId>("overview");
  const buttonRefs = useRef(new Map<ProfileSectionId, HTMLButtonElement>());
  const panels: Readonly<Record<ProfileSectionId, ReactNode>> = {
    overview,
    capabilities,
    credentials,
    locations,
    media,
    preferences,
  };

  const move = (event: KeyboardEvent<HTMLButtonElement>, current: ProfileSectionId) => {
    const index = SECTION_IDS.indexOf(current);
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % SECTION_IDS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + SECTION_IDS.length) % SECTION_IDS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = SECTION_IDS.length - 1;
    else return;
    event.preventDefault();
    const next = SECTION_IDS[nextIndex];
    setActive(next);
    window.requestAnimationFrame(() => buttonRefs.current.get(next)?.focus());
  };

  return (
    <div className={styles.portal}>
      <div className={styles.tabScroller}>
        <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
          {SECTION_IDS.map((id) => (
            <button
              key={id}
              ref={(node) => {
                if (node) buttonRefs.current.set(id, node);
                else buttonRefs.current.delete(id);
              }}
              type="button"
              role="tab"
              id={`organization-profile-tab-${id}`}
              aria-controls={`organization-profile-panel-${id}`}
              aria-selected={active === id}
              tabIndex={active === id ? 0 : -1}
              onClick={() => setActive(id)}
              onKeyDown={(event) => move(event, id)}
            >
              {labels[id]}
            </button>
          ))}
        </div>
      </div>

      {SECTION_IDS.map((id) => (
        <section
          key={id}
          id={`organization-profile-panel-${id}`}
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`organization-profile-tab-${id}`}
          hidden={active !== id}
          tabIndex={0}
        >
          {panels[id]}
        </section>
      ))}
    </div>
  );
}
