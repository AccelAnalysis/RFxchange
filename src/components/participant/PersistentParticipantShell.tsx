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
import { ExchangeSceneContext, ExchangeSpatialRenderer, type ExchangeSpatialSceneProps } from "../map/ExchangeSpatialScene";

interface ParticipantPageProps {
  readonly activeItem?: ParticipantNavigationItem;
  readonly organizationName?: string;
  readonly unavailableLensIds?: readonly ParticipantLensId[];
  readonly unavailableUtilityIds?: readonly ParticipantUtilityId[];
  readonly children: ReactNode;
}

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

export function ParticipantPage({
  activeItem,
  organizationName,
  unavailableLensIds,
  unavailableUtilityIds,
  children,
}: ParticipantPageProps) {
  const {
    persistent,
    registerExplicitActiveItem,
    registerUnavailableDestinations,
    reportAuthorizedOrganizationName,
    reportAuthorizedParticipant,
  } = usePersistentParticipantShellContext();

  useEffect(() => {
    if (persistent) reportAuthorizedParticipant();
  }, [persistent, reportAuthorizedParticipant]);

  useEffect(() => {
    if (persistent && organizationName) {
      reportAuthorizedOrganizationName(organizationName);
    }
  }, [organizationName, persistent, reportAuthorizedOrganizationName]);

  useEffect(() => {
    if (!persistent || activeItem === undefined) return;
    return registerExplicitActiveItem(activeItem);
  }, [activeItem, persistent, registerExplicitActiveItem]);

  useEffect(() => {
    if (!persistent || (!unavailableLensIds?.length && !unavailableUtilityIds?.length)) return;
    return registerUnavailableDestinations({
      lensIds: unavailableLensIds,
      utilityIds: unavailableUtilityIds,
    });
  }, [
    persistent,
    registerUnavailableDestinations,
    unavailableLensIds,
    unavailableUtilityIds,
  ]);

  return <>{children}</>;
}

function MountedPersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const shellInstanceId = useId();
  const [scene, setScene] = useState<Readonly<{ token: symbol; props: ExchangeSpatialSceneProps }> | null>(null);
  const registerScene = useCallback((props: ExchangeSpatialSceneProps) => {
    const token = Symbol("exchange-scene");
    setScene({ token, props });
    return () => setScene((current) => current?.token === token ? null : current);
  }, []);
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
      <ExchangeSceneContext.Provider value={registerScene}>
      <div
        className={styles.shell}
        data-participant-shell={authorizedParticipant ? "persistent" : undefined}
        data-participant-shell-instance={authorizedParticipant ? shellInstanceId : undefined}
        data-participant-authorized={authorizedParticipant ? "true" : "false"}
      >
        {authorizedParticipant && scene ? <ExchangeSpatialRenderer {...scene.props} /> : null}
        {authorizedParticipant ? (
          <ParticipantTopNavigation
            activeItem={explicitActiveItem?.activeItem}
            organizationName={organizationName}
            unavailableLensIds={unavailableDestinations?.lensIds}
            unavailableUtilityIds={unavailableDestinations?.utilityIds}
          />
        ) : null}
        <div
          className={styles.content}
          data-participant-content-region={authorizedParticipant ? "" : undefined}
        >
          {children}
        </div>
      </div>
      </ExchangeSceneContext.Provider>
    </PersistentParticipantShellContext.Provider>
  );
}

/** One root-layout shell. Authorized pages supply display context without a second auth read.
 * Leaving the route family unmounts participant state. Navigation never grants authority. */
export function PersistentParticipantShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const persistent = isPersistentParticipantPath(pathname);

  useEffect(() => {
    if (/^\/(?:signin|join|access)(?:\/|$)/.test(pathname)) clearParticipantSpatialContexts();
  }, [pathname]);

  if (!persistent) return children;
  return <MountedPersistentParticipantShell>{children}</MountedPersistentParticipantShell>;
}
