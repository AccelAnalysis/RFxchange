import { createHash } from "node:crypto";

import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import {
  assertEducationItem,
  assertExplainerKey,
  educationPath,
  NETWORK_EDUCATION_CATALOG_VERSION,
  NETWORK_EDUCATION_PATHS,
  recommendedEducationPath,
  type NetworkEducationPathKey,
} from "./catalog.ts";
import {
  createNetworkEducationProgress,
  updateNetworkEducationProgress,
  type NetworkEducationAction,
  type NetworkEducationCommandReceipt,
  type NetworkEducationEvent,
  type NetworkEducationProgress,
} from "../../domain/network-education/model.ts";
import type { NetworkEducationRepository } from "../../domain/network-education/repository.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";

export class NetworkEducationError extends Error {
  readonly code: "forbidden" | "invalid" | "conflict";
  constructor(code: NetworkEducationError["code"], message: string) {
    super(message);
    this.name = "NetworkEducationError";
    this.code = code;
  }
}

export interface NetworkEducationScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId?: string;
}

export interface NetworkEducationMutation {
  readonly action: NetworkEducationAction;
  readonly expectedVersion: number | null;
  readonly pathKey?: string | null;
  readonly itemKey?: string | null;
  readonly explainerKey?: string | null;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function networkEducationProgressId(userId: string, organizationId: string, membershipId: string): string {
  return `network-education-${createHash("sha256").update(`${userId}:${organizationId}:${membershipId}`).digest("hex").slice(0, 48)}`;
}

function commandId(value: string | undefined): string {
  const normalized = value?.trim() ?? "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new NetworkEducationError("invalid", "Education command identity is invalid.");
  }
  return normalized;
}

function scopeValues(scope: NetworkEducationScope) {
  if (!scope.context) throw new NetworkEducationError("forbidden", "Sign in to use Network education.");
  try {
    return Object.freeze({
      userId: scope.context.user.id,
      organizationId: organizationId(scope.organizationId),
      membershipId: organizationMembershipId(scope.membershipId),
    });
  } catch {
    throw new NetworkEducationError("invalid", "Education participant scope is invalid.");
  }
}

function preview(scope: NetworkEducationScope, officialResourceProvider: boolean, now: string): NetworkEducationProgress {
  const values = scopeValues(scope);
  return createNetworkEducationProgress({
    id: networkEducationProgressId(String(values.userId), String(values.organizationId), String(values.membershipId)),
    ...values,
    recommendedPath: recommendedEducationPath(officialResourceProvider),
    now,
  });
}

export class NetworkEducationService {
  private readonly repository: NetworkEducationRepository;
  private readonly now: () => string;

  constructor(repository: NetworkEducationRepository, now: () => string = () => new Date().toISOString()) {
    this.repository = repository;
    this.now = now;
  }

  async snapshot(scope: Omit<NetworkEducationScope, "commandId">, officialResourceProvider: boolean) {
    const initial = preview(scope, officialResourceProvider, this.now());
    const persisted = await this.repository.getProgress(initial.id);
    if (persisted && (
      String(persisted.userId) !== String(initial.userId) ||
      String(persisted.organizationId) !== String(initial.organizationId) ||
      String(persisted.membershipId) !== String(initial.membershipId)
    )) throw new NetworkEducationError("forbidden", "Education progress belongs to another participant context.");
    const progress = Object.freeze({ ...(persisted ?? initial), recommendedPath: recommendedEducationPath(officialResourceProvider) });
    return Object.freeze({
      progress,
      persisted: Boolean(persisted),
      catalogVersion: NETWORK_EDUCATION_CATALOG_VERSION,
      catalogUpdateAvailable: progress.contentVersion < NETWORK_EDUCATION_CATALOG_VERSION,
      paths: NETWORK_EDUCATION_PATHS,
    });
  }

  async mutate(scope: NetworkEducationScope, mutation: NetworkEducationMutation, officialResourceProvider: boolean) {
    const idempotencyKey = commandId(scope.commandId);
    const values = scopeValues(scope);
    const requestFingerprint = fingerprint(mutation);
    const prior = await this.repository.getCommand(idempotencyKey);
    if (prior) {
      if (prior.progressId !== networkEducationProgressId(String(values.userId), String(values.organizationId), String(values.membershipId)) || prior.requestFingerprint !== requestFingerprint) {
        throw new NetworkEducationError("conflict", "Education command identity was already used for different input.");
      }
      const current = await this.repository.getProgress(prior.progressId);
      if (!current) throw new NetworkEducationError("conflict", "Education command evidence is incomplete.");
      return Object.freeze({ replayed: true as const, progress: current, receipt: prior });
    }
    const initial = preview(scope, officialResourceProvider, this.now());
    const current = await this.repository.getProgress(initial.id);
    if (!["path-selected", "item-completed", "guide-dismissed", "guide-reopened", "guide-completed", "explainer-viewed", "explainer-dismissed", "catalog-synchronized"].includes(mutation.action)) {
      throw new NetworkEducationError("invalid", "Education action is unsupported.");
    }
    const expected = current ? mutation.expectedVersion : null;
    if (current && mutation.expectedVersion !== current.version) {
      throw new NetworkEducationError("conflict", `Education progress changed; current version is ${current.version}. Reload and try again.`);
    }
    if (!current && mutation.expectedVersion !== null && mutation.expectedVersion !== 0) {
      throw new NetworkEducationError("conflict", "Education progress has not been started in this organization.");
    }
    const pathKey = (mutation.pathKey ?? current?.activePath ?? initial.activePath) as NetworkEducationPathKey;
    educationPath(pathKey);
    if (mutation.action === "item-completed") {
      if (!mutation.itemKey) throw new NetworkEducationError("invalid", "Choose an education item to complete.");
      assertEducationItem(pathKey, mutation.itemKey);
    }
    const explainerKey = mutation.explainerKey ? assertExplainerKey(mutation.explainerKey) : null;
    if (["explainer-viewed", "explainer-dismissed"].includes(mutation.action) && !explainerKey) {
      throw new NetworkEducationError("invalid", "Choose a workflow explainer.");
    }
    const recommendedPath = recommendedEducationPath(officialResourceProvider);
    const progress = current
      ? updateNetworkEducationProgress({
          current,
          expectedVersion: current.version,
          action: mutation.action,
          recommendedPath,
          pathKey,
          itemKey: mutation.itemKey,
          explainerKey,
          now: this.now(),
        })
      : updateNetworkEducationProgress({
          current: initial,
          expectedVersion: 0,
          action: mutation.action,
          recommendedPath,
          pathKey,
          itemKey: mutation.itemKey,
          explainerKey,
          now: this.now(),
        });
    const event: NetworkEducationEvent = Object.freeze({
      id: `network-education-event-${fingerprint(idempotencyKey).slice(0, 40)}`,
      progressId: progress.id,
      ...values,
      kind: mutation.action,
      aggregateVersion: progress.version,
      contentVersion: progress.contentVersion,
      pathKey: progress.activePath,
      itemKey: mutation.itemKey ?? null,
      explainerKey,
      commandId: idempotencyKey,
      occurredAt: progress.updatedAt,
    });
    const receipt: NetworkEducationCommandReceipt = Object.freeze({
      id: idempotencyKey,
      progressId: progress.id,
      userId: values.userId,
      organizationId: values.organizationId,
      action: mutation.action,
      requestFingerprint,
      resultingVersion: progress.version,
      recordedAt: progress.updatedAt,
    });
    try {
      await this.repository.save({ progress, expectedVersion: expected, event, command: receipt });
    } catch (error) {
      throw new NetworkEducationError("conflict", error instanceof Error ? error.message : "Education progress could not be saved.");
    }
    return Object.freeze({ replayed: false as const, progress, receipt });
  }
}
