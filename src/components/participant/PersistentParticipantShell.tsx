"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { isPersistentParticipantPath } from "../../application/participant/participant-lens-registry";
import { ParticipantTopNavigation } from "./ParticipantTopNavigation";

import styles from "./PersistentParticipantShell.module.css";

const PersistentParticipantShellContext = createContext(false);

export function usePersistentParticipantShell(): boolean {
  return useContext(PersistentParticipantShellContext);
}

/**
 * Root-layout boundary for the authenticated Exchange.
 *
 * The component itself stays mounted with the root layout. Its participant shell remains the same
 * React/DOM shell while the pathname moves among authenticated market lenses and Account utilities.
 * Transitional, public, administrative, and recovery routes remain outside this participant shell.
 */
export function PersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const shellInstanceId = useId();

  if (!isPersistentParticipantPath(pathname)) return children;

  return (
    <PersistentParticipantShellContext.Provider value>
      <div
        className={styles.shell}
        data-participant-shell="persistent"
        data-participant-shell-instance={shellInstanceId}
      >
        <ParticipantTopNavigation />
        <div className={styles.content} data-participant-content-region>
          {children}
        </div>
      </div>
    </PersistentParticipantShellContext.Provider>
  );
}
