import type { AmacsCatalogPort } from "../amacs/catalog.ts";
import type { AmacsCapabilitySearch } from "../../domain/amacs/model.ts";

/**
 * Release-aware non-AI application path for later manual consumers.
 * This service intentionally has no provider dependency, quota dependency, or participant UI.
 */
export class ManualAmacsCatalogService {
  private readonly catalog: AmacsCatalogPort;
  constructor(catalog: AmacsCatalogPort) { this.catalog = catalog; }

  release() {
    return this.catalog.getRelease();
  }

  search(input: AmacsCapabilitySearch) {
    return this.catalog.searchCapabilities(input);
  }

  listDomains() {
    return this.catalog.listDomains();
  }

  listFamilies(domainId: string) {
    return this.catalog.listFamilies(domainId);
  }

  listCapabilities(familyId: string) {
    return this.catalog.listCapabilities(familyId);
  }

  capability(capabilityId: string) {
    return this.catalog.getCapability(capabilityId);
  }
}
