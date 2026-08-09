import de from "./messages/de.json";
import enUS from "./messages/en-US.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";
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

import type { Locale } from "./config";

export type Dictionary = typeof enUS & Readonly<{
  networkWorkspace: typeof networkEnUS;
  marketProfile: typeof marketProfileEnUS;
  organizationEnrichment: typeof organizationEnrichmentEnUS;
  referralWorkspace: typeof referralEnUS;
  resourceProviderWorkspace: typeof resourceProviderEnUS;
  resourceNetworkWorkspace: typeof resourceNetworkEnUS;
  networkEducation: typeof networkEducationEnUS;
}>;

function dictionary(
  base: typeof enUS,
  networkWorkspace: typeof networkEnUS,
  marketProfile: typeof marketProfileEnUS,
  organizationEnrichment: typeof organizationEnrichmentEnUS,
  referralWorkspace: typeof referralEnUS,
  resourceProviderWorkspace: typeof resourceProviderEnUS,
  resourceNetworkWorkspace: typeof resourceNetworkEnUS,
  networkEducation: typeof networkEducationEnUS,
): Dictionary {
  return Object.freeze({
    ...base,
    networkWorkspace,
    marketProfile,
    organizationEnrichment,
    referralWorkspace,
    resourceProviderWorkspace,
    resourceNetworkWorkspace,
    networkEducation,
  });
}

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": dictionary(enUS, networkEnUS, marketProfileEnUS, organizationEnrichmentEnUS, referralEnUS, resourceProviderEnUS, resourceNetworkEnUS, networkEducationEnUS),
  es: dictionary(es as typeof enUS, networkEs as typeof networkEnUS, marketProfileEs as typeof marketProfileEnUS, organizationEnrichmentEs as typeof organizationEnrichmentEnUS, referralEs as typeof referralEnUS, resourceProviderEs as typeof resourceProviderEnUS, resourceNetworkEs as typeof resourceNetworkEnUS, networkEducationEs as typeof networkEducationEnUS),
  fr: dictionary(fr as typeof enUS, networkFr as typeof networkEnUS, marketProfileFr as typeof marketProfileEnUS, organizationEnrichmentFr as typeof organizationEnrichmentEnUS, referralFr as typeof referralEnUS, resourceProviderFr as typeof resourceProviderEnUS, resourceNetworkFr as typeof resourceNetworkEnUS, networkEducationFr as typeof networkEducationEnUS),
  it: dictionary(it as typeof enUS, networkIt as typeof networkEnUS, marketProfileIt as typeof marketProfileEnUS, organizationEnrichmentIt as typeof organizationEnrichmentEnUS, referralIt as typeof referralEnUS, resourceProviderIt as typeof resourceProviderEnUS, resourceNetworkIt as typeof resourceNetworkEnUS, networkEducationIt as typeof networkEducationEnUS),
  de: dictionary(de as typeof enUS, networkDe as typeof networkEnUS, marketProfileDe as typeof marketProfileEnUS, organizationEnrichmentDe as typeof organizationEnrichmentEnUS, referralDe as typeof referralEnUS, resourceProviderDe as typeof resourceProviderEnUS, resourceNetworkDe as typeof resourceNetworkEnUS, networkEducationDe as typeof networkEducationEnUS),
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
