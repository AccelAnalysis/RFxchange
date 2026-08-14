"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  isPersistentParticipantPath,
  type ParticipantLensId,
  type ParticipantUtilityId,
} from "../../application/participant/participant-lens-registry";
import { clearParticipantSpatialContexts } from "../../application/participant/participant-spatial-context";
import {
  ParticipantTopNavigation,
  type ParticipantNavigationItem,
} from "./ParticipantTopNavigation";

import styles from "./PersistentParticipantShell.module.css";

interface PersistentParticipantShellContextValue {
  readonly persistent: boolean;
  readonly organizationName: string | null;
  readonly reportAuthorizedParticipant: () => void;
  readonly reportAuthorizedOrganizationName: (organizationName: string) => void;
  readonly registerExplicitActiveItem: (activeItem: ParticipantNavigationItem) => () => void;
  readonly registerUnavailableDestinations: (input: Readonly<{
    lensIds?: readonly ParticipantLensId[];
    utilityIds?: readonly ParticipantUtilityId[];
  }>) => () => void;
}

interface ExplicitActiveItemRegistration {
  readonly token: symbol;
  readonly activeItem: ParticipantNavigationItem;
}

interface UnavailableDestinationRegistration {
  readonly token: symbol;
  readonly lensIds: readonly ParticipantLensId[];
  readonly utilityIds: readonly ParticipantUtilityId[];
}

const EMPTY_SHELL_CONTEXT: PersistentParticipantShellContextValue = Object.freeze({
  persistent: false,
  organizationName: null,
  reportAuthorizedParticipant: () => undefined,
  reportAuthorizedOrganizationName: () => undefined,
  registerExplicitActiveItem: () => () => undefined,
  registerUnavailableDestinations: () => () => undefined,
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
  const [authorizedParticipant, setAuthorizedParticipant] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [explicitActiveItem, setExplicitActiveItem] = useState<ExplicitActiveItemRegistration>();
  const [unavailableDestinations, setUnavailableDestinations] = useState<UnavailableDestinationRegistration>();
  const reportAuthorizedParticipant = useCallback(() => {
    setAuthorizedParticipant(true);
  }, []);
  const reportAuthorizedOrganizationName = useCallback((value: string) => {
    const normalized = value.trim();
    if (normalized) setOrganizationName((current) => current === normalized ? current : normalized);
  }, []);
  const registerExplicitActiveItem = useCallback((activeItem: ParticipantNavigationItem) => {
    const token = Symbol("participant-active-item");
    setExplicitActiveItem({ token, activeItem });

    return () => {
      setExplicitActiveItem((current) => current?.token === token ? undefined : current);
    };
  }, []);
  const registerUnavailableDestinations = useCallback((input: Readonly<{
    lensIds?: readonly ParticipantLensId[];
    utilityIds?: readonly ParticipantUtilityId[];
  }>) => {
    const token = Symbol("participant-unavailable-destinations");
    setUnavailableDestinations({
      token,
      lensIds: Object.freeze([...(input.lensIds ?? [])]),
      utilityIds: Object.freeze([...(input.utilityIds ?? [])]),
    });

    return () => {
      setUnavailableDestinations((current) => current?.token === token ? undefined : current);
    };
  }, []);

  const context = useMemo<PersistentParticipantShellContextValue>(() => Object.freeze({
    persistent: true,
    organizationName,
    reportAuthorizedParticipant,
    reportAuthorizedOrganizationName,
    registerExplicitActiveItem,
    registerUnavailableDestinations,
  }), [
    organizationName,
    registerExplicitActiveItem,
    reportAuthorizedOrganizationName,
    reportAuthorizedParticipant,
    registerUnavailableDestinations,
  ]);

  return (
    <PersistentParticipantShellContext.Provider value={context}>
      <div
        className={authorizedParticipant ? styles.shell : undefined}
        data-participant-shell={authorizedParticipant ? "persistent" : undefined}
        data-participant-shell-instance={authorizedParticipant ? shellInstanceId : undefined}
        data-participant-authorized={authorizedParticipant ? "true" : "false"}
      >
        {authorizedParticipant ? (
          <ParticipantTopNavigation
            activeItem={explicitActiveItem?.activeItem}
            organizationName={organizationName}
            unavailableLensIds={unavailableDestinations?.lensIds}
            unavailableUtilityIds={unavailableDestinations?.utilityIds}
          />
        ) : null}
        <div
          className={authorizedParticipant ? styles.content : undefined}
          data-participant-content-region={authorizedParticipant ? "" : undefined}
        >
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
 * Navigation remains absent until an already-authorized page projection reports into this in-memory
 * context, preventing a protected pathname's streamed loading state from presenting a participant
 * shell to a signed-out visitor. Authorized pages may then report organization identity and
 * compatibility-route navigation state without repeated participant-route verification or
 * organization hydration. Leaving the participant route family unmounts the inner shell so its
 * in-memory state cannot leak into a later participant session.
 */
export function PersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const persistent = isPersistentParticipantPath(pathname);

  useEffect(() => {
    if (/^\/(?:signin|join|access)(?:\/|$)/.test(pathname)) clearParticipantSpatialContexts();
  }, [pathname]);

  if (!persistent) return children;
  return <MountedPersistentParticipantShell>{children}</MountedPersistentParticipantShell>;
}
