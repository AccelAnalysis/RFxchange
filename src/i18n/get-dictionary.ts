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

import type { Locale } from "./config";

export type Dictionary = typeof enUS & Readonly<{
  networkWorkspace: typeof networkEnUS;
  marketProfile: typeof marketProfileEnUS;
}>;

function dictionary(
  base: typeof enUS,
  networkWorkspace: typeof networkEnUS,
  marketProfile: typeof marketProfileEnUS,
): Dictionary {
  return Object.freeze({
    ...base,
    networkWorkspace,
    marketProfile,
  });
}

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": dictionary(enUS, networkEnUS, marketProfileEnUS),
  es: dictionary(es as typeof enUS, networkEs as typeof networkEnUS, marketProfileEs as typeof marketProfileEnUS),
  fr: dictionary(fr as typeof enUS, networkFr as typeof networkEnUS, marketProfileFr as typeof marketProfileEnUS),
  it: dictionary(it as typeof enUS, networkIt as typeof networkEnUS, marketProfileIt as typeof marketProfileEnUS),
  de: dictionary(de as typeof enUS, networkDe as typeof networkEnUS, marketProfileDe as typeof marketProfileEnUS),
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
