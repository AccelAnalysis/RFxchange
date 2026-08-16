import {
  rfxId,
} from "../../domain/rfx/model.ts";
import {
  rfxPublicationReference,
  rfxPublicationSnapshotId,
  type ReadinessFinding,
  type RequirementReadinessStatus,
} from "../../domain/rfx/publication.ts";
import {
  RfxPublicationService,
  type RfxPublicationServiceDependencies,
} from "./rfx-publication-service.ts";
import {
  RfxDraftError,
  type RfxCommandScope,
} from "./rfx-draft-service.ts";

function geographyQualifierRequirements(aggregate: Awaited<ReturnType<RfxPublicationServiceDependencies["repository"]["getById"]>>) {
  if (!aggregate?.definition) return Object.freeze([]);
  return Object.freeze(
    aggregate.definition.requirements.flatMap((requirement) => {
      const localityIds = [...new Set(requirement.qualifiers.flatMap((qualifier) =>
        qualifier.kind === "geography" ? [...qualifier.localityIds] : [],
      ))].sort();
      return localityIds.length
        ? [Object.freeze({ requirementId: requirement.id, localityIds: Object.freeze(localityIds) })]
        : [];
    }),
  );
}

export class Wave4GapPublicationService extends RfxPublicationService {
  private readonly gapDependencies: RfxPublicationServiceDependencies;

  constructor(dependencies: RfxPublicationServiceDependencies) {
    super(dependencies);
    this.gapDependencies = dependencies;
  }

  override async readinessAndPreview(
    scope: Omit<RfxCommandScope, "commandId">,
    input: Readonly<{ rfxId: string; audience: string }>,
  ) {
    const result = await super.readinessAndPreview(scope, input);
    const aggregateId = rfxId(input.rfxId);
    const aggregate = await this.gapDependencies.repository.getById(aggregateId);
    if (!aggregate || aggregate.id !== result.readiness.rfxId) {
      throw new RfxDraftError(
        "dependency-unavailable",
        "RFx publication readiness is temporarily unavailable.",
      );
    }

    const qualifierRequirements = geographyQualifierRequirements(aggregate);
    if (!qualifierRequirements.length) return result;
    const localityIds = [...new Set(qualifierRequirements.flatMap((item) => item.localityIds))];
    const localities = await Promise.all(
      localityIds.map(async (id) => [id, await this.gapDependencies.geographies.getById(id as never)] as const),
    );
    const unavailable = new Set(
      localities.flatMap(([id, geography]) =>
        !geography || geography.releaseState !== "released" ? [id] : [],
      ),
    );
    if (!unavailable.size) return result;

    const blockedRequirementIds = new Set(
      qualifierRequirements.flatMap((item) =>
        item.localityIds.some((id) => unavailable.has(id)) ? [item.requirementId] : [],
      ),
    );
    const qualifierFindings: readonly ReadinessFinding[] = Object.freeze(
      [...blockedRequirementIds].map((requirementId) => Object.freeze({
        code: "definition.requirements.incomplete",
        severity: "blocking" as const,
        sourcePath: `definition.requirements.${requirementId}.qualifiers`,
        workspaceTarget: `#rfx-requirement-${requirementId}`,
        relatedRecordId: requirementId,
      })),
    );
    const requirementStatus: readonly RequirementReadinessStatus[] = Object.freeze(
      result.readiness.requirementStatus.map((item) =>
        blockedRequirementIds.has(item.requirementId)
          ? Object.freeze({
              ...item,
              status: "blocked" as const,
              findingCodes: Object.freeze([
                ...new Set([...item.findingCodes, "definition.requirements.incomplete"]),
              ]),
            })
          : item,
      ),
    );
    return Object.freeze({
      ...result,
      readiness: Object.freeze({
        ...result.readiness,
        status: "blocked" as const,
        findings: Object.freeze([...result.readiness.findings, ...qualifierFindings]),
        requirementStatus,
      }),
      preview: null,
    });
  }

  override async publish(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      previewDigest: string;
      audience: string;
    }>,
  ) {
    const result = await super.publish(scope, input);
    if (!result.replayed) return result;

    const aggregateId = rfxId(input.rfxId);
    const [aggregate, snapshot, projection, receipt] = await Promise.all([
      this.gapDependencies.repository.getById(aggregateId),
      this.gapDependencies.repository.getPublicationSnapshot(
        rfxPublicationSnapshotId(aggregateId),
      ),
      this.gapDependencies.repository.getProjection(
        rfxPublicationReference(aggregateId),
      ),
      this.gapDependencies.repository.getCommand(scope.commandId),
    ]);
    if (
      !aggregate ||
      aggregate.issuerOrganizationId !== result.aggregate.issuerOrganizationId ||
      !snapshot ||
      snapshot.rfxId !== aggregateId ||
      snapshot.aggregateVersion !== aggregate.version ||
      !projection ||
      projection.reference !== snapshot.reference ||
      projection.aggregateVersion !== aggregate.version ||
      !receipt ||
      receipt.rfxId !== aggregateId ||
      receipt.action !== "publish"
    ) {
      throw new RfxDraftError(
        "dependency-unavailable",
        "The committed RFx publication is temporarily unavailable.",
      );
    }
    return Object.freeze({
      aggregate,
      snapshot,
      projection,
      receipt,
      replayed: true as const,
    });
  }
}
