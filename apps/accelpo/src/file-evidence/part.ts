import type { AccelPOPartContract, AccelPOConnectionPoint } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import { FILE_EVIDENCE_COMMANDS, FILE_EVIDENCE_UPLOAD_AUTHORITIES } from "./contracts.ts";

export const CP07_FILE_EVIDENCE_PART: AccelPOPartContract = Object.freeze({
  id: "CP-07",
  routes: Object.freeze([]),
  permissions: Object.freeze([
    "purchasing.request",
    "purchasing.order",
    "purchasing.documentation.review",
    "purchasing.budget.manage",
    "purchasing.configure",
    "rfx.publish",
  ]),
  connectionPoints: Object.freeze([
    "FileEvidence",
    "CommandPort",
    "QueryProjection",
  ] as readonly AccelPOConnectionPoint[]),
});

export const CP07_FILE_EVIDENCE_REGISTRATION = Object.freeze({
  uploadEndpoint: "/api/accelpo/evidence/:evidenceId/content",
  downloadEndpoint: "/api/accelpo/evidence/:evidenceId/content",
  projection: "evidence-metadata",
  commands: Object.freeze([
    ...FILE_EVIDENCE_UPLOAD_AUTHORITIES.flatMap((authority) => [
      authority.initiateCommand,
      authority.authorizeCommand,
      authority.completeCommand,
    ]),
    FILE_EVIDENCE_COMMANDS.release,
    FILE_EVIDENCE_COMMANDS.makePrivate,
  ]),
  ownedCollections: Object.freeze(["accelpoEvidence", "accelpoEvidenceHistory"]),
  ownedInfrastructureCollections: Object.freeze(["accelpoEvidenceObjects"]),
  referencedCollections: Object.freeze(["accelpoPurchaseCases"]),
  externalPorts: Object.freeze(["Firebase private object storage", "RFxBridge released-file reference"]),
});

export function registerCP07FileEvidence(registry: AccelPOPartRegistry): void {
  registry.register(CP07_FILE_EVIDENCE_PART);
}
