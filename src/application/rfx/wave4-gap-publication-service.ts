import {
  rfxId,
} from "../../domain/rfx/model.ts";
import {
  rfxPublicationReference,
  rfxPublicationSnapshotId,
} from "../../domain/rfx/publication.ts";
import {
  RfxPublicationService,
  type RfxPublicationServiceDependencies,
} from "./rfx-publication-service.ts";
import {
  RfxDraftError,
  type RfxCommandScope,
} from "./rfx-draft-service.ts";

export class Wave4GapPublicationService extends RfxPublicationService {
  private readonly gapDependencies: RfxPublicationServiceDependencies;

  constructor(dependencies: RfxPublicationServiceDependencies) {
    super(dependencies);
    this.gapDependencies = dependencies;
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
