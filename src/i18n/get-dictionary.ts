import de from "./messages/de.json";
import enUS from "./messages/en-US.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";
import marketingPagesDe from "./messages/marketing-pages/de.json";
import marketingPagesEnUS from "./messages/marketing-pages/en-US.json";
import marketingPagesEs from "./messages/marketing-pages/es.json";
import marketingPagesFr from "./messages/marketing-pages/fr.json";
import marketingPagesIt from "./messages/marketing-pages/it.json";
import networkDe from "./messages/network/de.json";
import networkEnUS from "./messages/network/en-US.json";
import networkEs from "./messages/network/es.json";
import networkFr from "./messages/network/fr.json";
import networkIt from "./messages/network/it.json";
import marketProfileDe from "./messages/market-profile/de.json";
import marketProfileEnUS from "./messages/market-profile/en-US.json";
import marketProfileEs from "./messages/market-profile/es.json";
import marketProfileFr from "./messages/market-profile/fr.json";
import marketProfileIt from "./messages/market-profile/it.json";
import organizationEnrichmentDe from "./messages/organization-enrichment/de.json";
import organizationEnrichmentEnUS from "./messages/organization-enrichment/en-US.json";
import organizationEnrichmentEs from "./messages/organization-enrichment/es.json";
import organizationEnrichmentFr from "./messages/organization-enrichment/fr.json";
import organizationEnrichmentIt from "./messages/organization-enrichment/it.json";
import referralDe from "./messages/referrals/de.json";
import referralEnUS from "./messages/referrals/en-US.json";
import referralEs from "./messages/referrals/es.json";
import referralFr from "./messages/referrals/fr.json";
import referralIt from "./messages/referrals/it.json";
import resourceProviderDe from "./messages/resource-providers/de.json";
import resourceProviderEnUS from "./messages/resource-providers/en-US.json";
import resourceProviderEs from "./messages/resource-providers/es.json";
import resourceProviderFr from "./messages/resource-providers/fr.json";
import resourceProviderIt from "./messages/resource-providers/it.json";
import resourceNetworkDe from "./messages/resource-network/de.json";
import resourceNetworkEnUS from "./messages/resource-network/en-US.json";
import resourceNetworkEs from "./messages/resource-network/es.json";
import resourceNetworkFr from "./messages/resource-network/fr.json";
import resourceNetworkIt from "./messages/resource-network/it.json";
import networkEducationDe from "./messages/network-education/de.json";
import networkEducationEnUS from "./messages/network-education/en-US.json";
import networkEducationEs from "./messages/network-education/es.json";
import networkEducationFr from "./messages/network-education/fr.json";
import networkEducationIt from "./messages/network-education/it.json";
import recoveryDe from "./messages/recovery/de.json";
import recoveryEnUS from "./messages/recovery/en-US.json";
import recoveryEs from "./messages/recovery/es.json";
import recoveryFr from "./messages/recovery/fr.json";
import recoveryIt from "./messages/recovery/it.json";
import workspaceResilienceDe from "./messages/workspace-resilience/de.json";
import workspaceResilienceEnUS from "./messages/workspace-resilience/en-US.json";
import workspaceResilienceEs from "./messages/workspace-resilience/es.json";
import workspaceResilienceFr from "./messages/workspace-resilience/fr.json";
import workspaceResilienceIt from "./messages/workspace-resilience/it.json";
import mapStabilizationDe from "./messages/map-stabilization/de.json";
import mapStabilizationEnUS from "./messages/map-stabilization/en-US.json";
import mapStabilizationEs from "./messages/map-stabilization/es.json";
import mapStabilizationFr from "./messages/map-stabilization/fr.json";
import mapStabilizationIt from "./messages/map-stabilization/it.json";
import participantNavigationDe from "./messages/participant-navigation/de.json";
import participantNavigationEnUS from "./messages/participant-navigation/en-US.json";
import participantNavigationEs from "./messages/participant-navigation/es.json";
import participantNavigationFr from "./messages/participant-navigation/fr.json";
import participantNavigationIt from "./messages/participant-navigation/it.json";
import rfxWorkspaceDe from "./messages/rfx/de.json";
import rfxWorkspaceEnUS from "./messages/rfx/en-US.json";
import rfxWorkspaceEs from "./messages/rfx/es.json";
import rfxWorkspaceFr from "./messages/rfx/fr.json";
import rfxWorkspaceIt from "./messages/rfx/it.json";
import rfxQualifierDe from "./messages/rfx-qualifier/de.json";
import rfxQualifierEnUS from "./messages/rfx-qualifier/en-US.json";
import rfxQualifierEs from "./messages/rfx-qualifier/es.json";
import rfxQualifierFr from "./messages/rfx-qualifier/fr.json";
import rfxQualifierIt from "./messages/rfx-qualifier/it.json";
import marketReadyFoundingCommerceDe from "./messages/market-ready-founding-commerce/de.json";
import marketReadyFoundingCommerceEnUS from "./messages/market-ready-founding-commerce/en-US.json";
import marketReadyFoundingCommerceEs from "./messages/market-ready-founding-commerce/es.json";
import marketReadyFoundingCommerceFr from "./messages/market-ready-founding-commerce/fr.json";
import marketReadyFoundingCommerceIt from "./messages/market-ready-founding-commerce/it.json";

import type { Locale } from "./config";
import { applyParticipantLanguageFirewall } from "./participant-language-firewall";

export type Dictionary = typeof enUS & Readonly<{
  marketingPages: typeof marketingPagesEnUS;
  networkWorkspace: typeof networkEnUS;
  marketProfile: typeof marketProfileEnUS;
  organizationEnrichment: typeof organizationEnrichmentEnUS;
  referralWorkspace: typeof referralEnUS;
  resourceProviderWorkspace: typeof resourceProviderEnUS;
  resourceNetworkWorkspace: typeof resourceNetworkEnUS;
  networkEducation: typeof networkEducationEnUS;
  recovery: typeof recoveryEnUS;
  workspaceResilience: typeof workspaceResilienceEnUS;
  mapStabilization: typeof mapStabilizationEnUS;
  participantNavigation: typeof participantNavigationEnUS;
  rfxWorkspace: typeof rfxWorkspaceEnUS;
  rfxQualifier: typeof rfxQualifierEnUS;
  marketReadyFoundingCommerce: typeof marketReadyFoundingCommerceEnUS;
}>;

export function normalizeBaseCatalog(base: unknown): typeof enUS {
  const catalog = base as typeof enUS & Readonly<{
    home?: typeof enUS.marketing.home;
  }>;
  if (catalog.marketing?.home) return catalog;
  if (!catalog.home || !catalog.marketing) {
    throw new Error("Base locale catalog is missing marketing home messages.");
  }
  const { home, ...rest } = catalog;
  return Object.freeze({
    ...rest,
    marketing: Object.freeze({
      ...catalog.marketing,
      home,
    }),
  }) as typeof enUS;
}

function dictionary(
  base: unknown,
  marketingPages: typeof marketingPagesEnUS,
  networkWorkspace: typeof networkEnUS,
  marketProfile: typeof marketProfileEnUS,
  organizationEnrichment: typeof organizationEnrichmentEnUS,
  referralWorkspace: typeof referralEnUS,
  resourceProviderWorkspace: typeof resourceProviderEnUS,
  resourceNetworkWorkspace: typeof resourceNetworkEnUS,
  networkEducation: typeof networkEducationEnUS,
  recovery: typeof recoveryEnUS,
  workspaceResilience: typeof workspaceResilienceEnUS,
  mapStabilization: typeof mapStabilizationEnUS,
  participantNavigation: typeof participantNavigationEnUS,
  rfxWorkspace: typeof rfxWorkspaceEnUS,
  rfxQualifier: typeof rfxQualifierEnUS,
  marketReadyFoundingCommerce: typeof marketReadyFoundingCommerceEnUS,
): Dictionary {
  return Object.freeze({
    ...normalizeBaseCatalog(base),
    marketingPages,
    networkWorkspace,
    marketProfile,
    organizationEnrichment,
    referralWorkspace,
    resourceProviderWorkspace,
    resourceNetworkWorkspace,
    networkEducation,
    recovery,
    workspaceResilience,
    mapStabilization,
    participantNavigation,
    rfxWorkspace,
    rfxQualifier,
    marketReadyFoundingCommerce,
  });
}

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": dictionary(enUS, marketingPagesEnUS, networkEnUS, marketProfileEnUS, organizationEnrichmentEnUS, referralEnUS, resourceProviderEnUS, resourceNetworkEnUS, networkEducationEnUS, recoveryEnUS, workspaceResilienceEnUS, mapStabilizationEnUS, participantNavigationEnUS, rfxWorkspaceEnUS, rfxQualifierEnUS, marketReadyFoundingCommerceEnUS),
  es: dictionary(es, marketingPagesEs as typeof marketingPagesEnUS, networkEs as typeof networkEnUS, marketProfileEs as typeof marketProfileEnUS, organizationEnrichmentEs as typeof organizationEnrichmentEnUS, referralEs as typeof referralEnUS, resourceProviderEs as typeof resourceProviderEnUS, resourceNetworkEs as typeof resourceNetworkEnUS, networkEducationEs as typeof networkEducationEnUS, recoveryEs as typeof recoveryEnUS, workspaceResilienceEs as typeof workspaceResilienceEnUS, mapStabilizationEs as typeof mapStabilizationEnUS, participantNavigationEs as typeof participantNavigationEnUS, rfxWorkspaceEs as typeof rfxWorkspaceEnUS, rfxQualifierEs as typeof rfxQualifierEnUS, marketReadyFoundingCommerceEs as typeof marketReadyFoundingCommerceEnUS),
  fr: dictionary(fr, marketingPagesFr as typeof marketingPagesEnUS, networkFr as typeof networkEnUS, marketProfileFr as typeof marketProfileEnUS, organizationEnrichmentFr as typeof organizationEnrichmentEnUS, referralFr as typeof referralEnUS, resourceProviderFr as typeof resourceProviderEnUS, resourceNetworkFr as typeof resourceNetworkEnUS, networkEducationFr as typeof networkEducationEnUS, recoveryFr as typeof recoveryEnUS, workspaceResilienceFr as typeof workspaceResilienceEnUS, mapStabilizationFr as typeof mapStabilizationEnUS, participantNavigationFr as typeof participantNavigationEnUS, rfxWorkspaceFr as typeof rfxWorkspaceEnUS, rfxQualifierFr as typeof rfxQualifierEnUS, marketReadyFoundingCommerceFr as typeof marketReadyFoundingCommerceEnUS),
  it: dictionary(it, marketingPagesIt as typeof marketingPagesEnUS, networkIt as typeof networkEnUS, marketProfileIt as typeof marketProfileEnUS, organizationEnrichmentIt as typeof organizationEnrichmentEnUS, referralIt as typeof referralEnUS, resourceProviderIt as typeof resourceProviderEnUS, resourceNetworkIt as typeof resourceNetworkEnUS, networkEducationIt as typeof networkEducationEnUS, recoveryIt as typeof recoveryEnUS, workspaceResilienceIt as typeof workspaceResilienceEnUS, mapStabilizationIt as typeof mapStabilizationEnUS, participantNavigationIt as typeof participantNavigationEnUS, rfxWorkspaceIt as typeof rfxWorkspaceEnUS, rfxQualifierIt as typeof rfxQualifierEnUS, marketReadyFoundingCommerceIt as typeof marketReadyFoundingCommerceEnUS),
  de: dictionary(de, marketingPagesDe as typeof marketingPagesEnUS, networkDe as typeof networkEnUS, marketProfileDe as typeof marketProfileEnUS, organizationEnrichmentDe as typeof organizationEnrichmentEnUS, referralDe as typeof referralEnUS, resourceProviderDe as typeof resourceProviderEnUS, resourceNetworkDe as typeof resourceNetworkEnUS, networkEducationDe as typeof networkEducationEnUS, recoveryDe as typeof recoveryEnUS, workspaceResilienceDe as typeof workspaceResilienceEnUS, mapStabilizationDe as typeof mapStabilizationEnUS, participantNavigationDe as typeof participantNavigationEnUS, rfxWorkspaceDe as typeof rfxWorkspaceEnUS, rfxQualifierDe as typeof rfxQualifierEnUS, marketReadyFoundingCommerceDe as typeof marketReadyFoundingCommerceEnUS),
});

export function getDictionary(locale: Locale): Dictionary {
  return applyParticipantLanguageFirewall(dictionaries[locale], locale);
}
