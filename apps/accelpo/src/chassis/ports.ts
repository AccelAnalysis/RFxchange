/**
 * AccelPO chassis connection points.
 *
 * These contracts are intentionally small. They describe where a part plugs into the shell;
 * they do not implement authentication, persistence, policy, billing, or RFxchange behavior.
 * Those concerns stay behind the shared RFxchange services when their parts are connected.
 */

export const ACCELPO_CONNECTION_POINTS = Object.freeze({
  CP_01_IDENTITY_CONTEXT: "IdentityContext",
  CP_02_ROUTE_SURFACE: "RouteSurface",
  CP_03_COMMAND_PORT: "CommandPort",
  CP_04_QUERY_PROJECTION: "QueryProjection",
  CP_05_POLICY_RESOLVER: "PolicyResolver",
  CP_06_TASK_NOTIFICATION: "TaskNotification",
  CP_07_FILE_EVIDENCE: "FileEvidence",
  CP_08_RFX_BRIDGE: "RFxBridge",
  CP_09_MARKETING_EVENT: "MarketingEvent",
  CP_10_ENTITLEMENT_BILLING: "EntitlementBilling",
} as const);

export type AccelPOConnectionPoint =
  (typeof ACCELPO_CONNECTION_POINTS)[keyof typeof ACCELPO_CONNECTION_POINTS];

export interface IdentityContextPort {
  readonly userId: string | null;
  readonly displayName: string | null;
  readonly activeOrganizationId: string | null;
  readonly membershipId: string | null;
  readonly permissions: readonly string[];
  readonly seatAllowance: number | null;
  readonly seatsInUse: number | null;
}

export interface RouteSurfacePort {
  readonly navigate: (route: string) => void;
  readonly currentRoute: () => string;
}

export interface RouteContribution {
  readonly id: string;
  readonly label: string;
  readonly hash: string;
  readonly icon: string | null;
  readonly showInNavigation?: boolean;
}

export interface CommandPort<Command = unknown, Result = unknown> {
  readonly execute: (command: Command) => Promise<Result>;
}

export interface QueryProjectionPort<Query = unknown, Projection = unknown> {
  readonly read: (query: Query) => Promise<Projection>;
}

export interface PolicyResolverPort<PolicyInput = unknown, Policy = unknown> {
  readonly resolve: (input: PolicyInput) => Promise<Policy>;
}

export interface TaskNotificationPort<Event = unknown> {
  readonly publish: (event: Event) => Promise<void>;
}

export interface FileEvidencePort<UploadContext = unknown, FileReference = unknown> {
  readonly upload: (context: UploadContext, file: File) => Promise<FileReference>;
}

export interface RFxBridgePort<Projection = unknown, Link = unknown> {
  readonly publishSupplierSafeNeed: (projection: Projection) => Promise<Link>;
}

export interface MarketingEventPort<Event = unknown> {
  readonly emit: (event: Event) => Promise<void>;
}

export interface EntitlementBillingPort<Entitlement = unknown> {
  readonly read: () => Promise<Entitlement>;
}

export interface AccelPOPartContract {
  readonly id: string;
  readonly routes: readonly string[];
  readonly permissions: readonly string[];
  readonly connectionPoints: readonly AccelPOConnectionPoint[];
}
