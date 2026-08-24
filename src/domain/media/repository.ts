import type { OrganizationId } from "../organizations/model.ts";
import type {
  GovernedMediaMutationBundle,
  GovernedMediaMutationCommand,
} from "./mutation.ts";
import type {
  OrganizationIntroductionMedia,
  OrganizationIntroductionMediaId,
  PublicMediaProjection,
  PublicMediaProjectionId,
  RfxAttachmentReference,
  RfxAttachmentReferenceId,
  VerifiedExternalVideo,
} from "./model.ts";

export interface PublicMediaProjectionRepository {
  getById(id: PublicMediaProjectionId): Promise<PublicMediaProjection | null>;
  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly PublicMediaProjection[]>;
  create(projection: PublicMediaProjection): Promise<void>;
  save(projection: PublicMediaProjection): Promise<void>;
}

export interface OrganizationIntroductionMediaRepository {
  getById(
    id: OrganizationIntroductionMediaId,
  ): Promise<OrganizationIntroductionMedia | null>;
  getPublishedByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationIntroductionMedia | null>;
  create(media: OrganizationIntroductionMedia): Promise<void>;
  save(media: OrganizationIntroductionMedia): Promise<void>;
}

export interface RfxAttachmentReferenceRepository {
  getById(id: RfxAttachmentReferenceId): Promise<RfxAttachmentReference | null>;
  listByRfxId(
    organizationId: OrganizationId,
    rfxId: string,
  ): Promise<readonly RfxAttachmentReference[]>;
  create(reference: RfxAttachmentReference): Promise<void>;
  save(reference: RfxAttachmentReference): Promise<void>;
}

export interface GovernedMediaMutationUnitOfWork {
  getCommand(id: string): Promise<GovernedMediaMutationCommand | null>;
  commit(bundle: GovernedMediaMutationBundle): Promise<"created" | "replayed">;
}

export interface ExternalOrganizationVideoResolver {
  resolve(input: Readonly<{
    readonly provider: "youtube" | "vimeo";
    readonly videoId: string;
  }>): Promise<VerifiedExternalVideo>;
}
