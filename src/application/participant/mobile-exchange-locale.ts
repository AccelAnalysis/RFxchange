import type { Locale } from "../../i18n/config";
import de from "../../i18n/messages/network/mobile-exchange-stage2/de.json";
import enUS from "../../i18n/messages/network/mobile-exchange-stage2/en-US.json";
import es from "../../i18n/messages/network/mobile-exchange-stage2/es.json";
import fr from "../../i18n/messages/network/mobile-exchange-stage2/fr.json";
import it from "../../i18n/messages/network/mobile-exchange-stage2/it.json";

export const MOBILE_EXCHANGE_LOCALE_VERSION = 1 as const;
export type MobileExchangeLocaleCatalog = typeof enUS;

const catalogs: Readonly<Record<Locale, MobileExchangeLocaleCatalog>> = Object.freeze({
  "en-US": enUS,
  es: es as MobileExchangeLocaleCatalog,
  fr: fr as MobileExchangeLocaleCatalog,
  it: it as MobileExchangeLocaleCatalog,
  de: de as MobileExchangeLocaleCatalog,
});

export function mobileExchangeLocaleCatalog(locale: Locale): MobileExchangeLocaleCatalog {
  return catalogs[locale];
}
