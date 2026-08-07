import de from "./messages/de.json";
import enUS from "./messages/en-US.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";

import type { Locale } from "./config";

export type Dictionary = typeof enUS;

const dictionaries: Readonly<Record<Locale, Dictionary>> = Object.freeze({
  "en-US": enUS,
  es: es as Dictionary,
  fr: fr as Dictionary,
  it: it as Dictionary,
  de: de as Dictionary,
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
