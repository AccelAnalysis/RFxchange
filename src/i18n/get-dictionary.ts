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

import type { Locale } from "./config";

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
}>;

function dictionary(
  base: typeof enUS,
  marketingPages: typeof marketingPagesEnUS,
  networkWorkspace: typeof networkEnUS,
  marketProfile: typeof marketProfileEnUS,
  organizationEnrichment: typeof organizationEnrichmentEnUS,
  referralWorkspace: typeof referralEnUS,
  resourceProviderWorkspace: typeof resourceProviderEnUS,
  resourceNetworkWorkspace: typeof resourceNetworkEnUS,
  networkEducation: typeof networkEducationEnUS,
  recovery: typeof recoveryEnUS,
): Dictionary {
  return Object.freeze({
    ...base,
    marketingPages,
    networkWorkspace,
    marketProfile,
    organizationEnrichment,
    referralWorkspace,
    resourceProviderWorkspace,
    resourceNetworkWorkspace,
    networkEducation,
    recovery,
  });
}

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": dictionary(enUS, marketingPagesEnUS, networkEnUS, marketProfileEnUS, organizationEnrichmentEnUS, referralEnUS, resourceProviderEnUS, resourceNetworkEnUS, networkEducationEnUS, recoveryEnUS),
  es: dictionary(es as typeof enUS, marketingPagesEs as typeof marketingPagesEnUS, networkEs as typeof networkEnUS, marketProfileEs as typeof marketProfileEnUS, organizationEnrichmentEs as typeof organizationEnrichmentEnUS, referralEs as typeof referralEnUS, resourceProviderEs as typeof resourceProviderEnUS, resourceNetworkEs as typeof resourceNetworkEnUS, networkEducationEs as typeof networkEducationEnUS, recoveryEs as typeof recoveryEnUS),
  fr: dictionary(fr as typeof enUS, marketingPagesFr as typeof marketingPagesEnUS, networkFr as typeof networkEnUS, marketProfileFr as typeof marketProfileEnUS, organizationEnrichmentFr as typeof organizationEnrichmentEnUS, referralFr as typeof referralEnUS, resourceProviderFr as typeof resourceProviderEnUS, resourceNetworkFr as typeof resourceNetworkEnUS, networkEducationFr as typeof networkEducationEnUS, recoveryFr as typeof recoveryEnUS),
  it: dictionary(it as typeof enUS, marketingPagesIt as typeof marketingPagesEnUS, networkIt as typeof networkEnUS, marketProfileIt as typeof marketProfileEnUS, organizationEnrichmentIt as typeof organizationEnrichmentEnUS, referralIt as typeof referralEnUS, resourceProviderIt as typeof resourceProviderEnUS, resourceNetworkIt as typeof resourceNetworkEnUS, networkEducationIt as typeof networkEducationEnUS, recoveryIt as typeof recoveryEnUS),
  de: dictionary(de as typeof enUS, marketingPagesDe as typeof marketingPagesEnUS, networkDe as typeof networkEnUS, marketProfileDe as typeof marketProfileEnUS, organizationEnrichmentDe as typeof organizationEnrichmentEnUS, referralDe as typeof referralEnUS, resourceProviderDe as typeof resourceProviderEnUS, resourceNetworkDe as typeof resourceNetworkEnUS, networkEducationDe as typeof networkEducationEnUS, recoveryDe as typeof recoveryEnUS),
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
