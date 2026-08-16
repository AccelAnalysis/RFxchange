import type { Locale } from "../../i18n/config";
import de from "../../i18n/messages/network/exchange-room-phase2/de.json";
import enUS from "../../i18n/messages/network/exchange-room-phase2/en-US.json";
import es from "../../i18n/messages/network/exchange-room-phase2/es.json";
import fr from "../../i18n/messages/network/exchange-room-phase2/fr.json";
import it from "../../i18n/messages/network/exchange-room-phase2/it.json";

export const EXCHANGE_ROOM_LOCALE_VERSION = 1 as const;
export type ExchangeRoomLocaleCatalog = typeof enUS;

const catalogs: Readonly<Record<Locale, ExchangeRoomLocaleCatalog>> = Object.freeze({
  "en-US": enUS,
  es: es as ExchangeRoomLocaleCatalog,
  fr: fr as ExchangeRoomLocaleCatalog,
  it: it as ExchangeRoomLocaleCatalog,
  de: de as ExchangeRoomLocaleCatalog,
});

export function exchangeRoomLocaleCatalog(locale: Locale): ExchangeRoomLocaleCatalog {
  return catalogs[locale];
}
