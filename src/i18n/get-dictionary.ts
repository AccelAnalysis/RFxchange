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

import type { Locale } from "./config";

export type Dictionary = typeof enUS & Readonly<{
  networkWorkspace: typeof networkEnUS;
}>;

function dictionary(
  base: typeof enUS,
  networkWorkspace: typeof networkEnUS,
): Dictionary {
  return Object.freeze({
    ...base,
    networkWorkspace,
  });
}

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": dictionary(enUS, networkEnUS),
  es: dictionary(es as typeof enUS, networkEs as typeof networkEnUS),
  fr: dictionary(fr as typeof enUS, networkFr as typeof networkEnUS),
  it: dictionary(it as typeof enUS, networkIt as typeof networkEnUS),
  de: dictionary(de as typeof enUS, networkDe as typeof networkEnUS),
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
