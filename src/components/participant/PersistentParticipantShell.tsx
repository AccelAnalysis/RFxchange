"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { isPersistentParticipantPath } from "../../application/participant/participant-lens-registry";
import { ParticipantTopNavigation } from "./ParticipantTopNavigation";

import styles from "./PersistentParticipantShell.module.css";

interface PersistentParticipantShellContextValue {
  readonly persistent: boolean;
  readonly organizationName: string | null;
  readonly reportAuthorizedOrganizationName: (organizationName: string) => void;
}

const EMPTY_SHELL_CONTEXT: PersistentParticipantShellContextValue = Object.freeze({
  persistent: false,
  organizationName: null,
  reportAuthorizedOrganizationName: () => undefined,
});

const PersistentParticipantShellContext = createContext<PersistentParticipantShellContextValue>(
  EMPTY_SHELL_CONTEXT,
);

export function usePersistentParticipantShell(): boolean {
  return useContext(PersistentParticipantShellContext).persistent;
}

export function usePersistentParticipantShellContext(): PersistentParticipantShellContextValue {
  return useContext(PersistentParticipantShellContext);
}

function MountedPersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const shellInstanceId = useId();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const reportAuthorizedOrganizationName = useCallback((value: string) => {
    const normalized = value.trim();
    if (normalized) setOrganizationName((current) => current === normalized ? current : normalized);
  }, []);

  const context = useMemo<PersistentParticipantShellContextValue>(() => Object.freeze({
    persistent: true,
    organizationName,
    reportAuthorizedOrganizationName,
  }), [organizationName, reportAuthorizedOrganizationName]);

  return (
    <PersistentParticipantShellContext.Provider value={context}>
      <div
        className={styles.shell}
        data-participant-shell="persistent"
        data-participant-shell-instance={shellInstanceId}
      >
        <ParticipantTopNavigation organizationName={organizationName} />
        <div className={styles.content} data-participant-content-region>
          {children}
        </div>
      </div>
    </PersistentParticipantShellContext.Provider>
  );
}

/**
 * Root-layout boundary for the authenticated Exchange.
 *
 * The component itself stays mounted with the root layout. Its participant shell remains the same
 * React/DOM shell while the pathname moves among authenticated market lenses and Account utilities.
 * Transitional, public, administrative, and recovery routes remain outside this participant shell.
 * Already-authorized page projections report organization identity through this in-memory context;
 * the shell never repeats participant-route verification or organization hydration merely to label
 * its Account control. Leaving the participant route family unmounts the inner shell so its
 * in-memory organization label cannot leak into a later participant session.
 */
export function PersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const persistent = isPersistentParticipantPath(pathname);

  if (!persistent) return children;
  return <MountedPersistentParticipantShell>{children}</MountedPersistentParticipantShell>;
}
