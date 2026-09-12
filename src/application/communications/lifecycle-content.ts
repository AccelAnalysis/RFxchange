import type { LifecycleJourney } from "../../domain/communications/lifecycle.ts";
import { resolveLocale } from "../../i18n/config.ts";

const copy = {
  "en-US": { subjects: ["Continue setting up your organization", "Your next business connection starts here", "Reconnect with your business community"], setup: "Continue setting up your organization on RFxchange when you are ready.", explore: "Visit RFxchange to explore opportunities, resources and business capabilities.", preferences: "Manage preferences", unsubscribe: "Unsubscribe from optional emails", stop: "Reply STOP to opt out." },
  es: { subjects: ["Continúa configurando tu organización", "Tu próxima conexión empresarial comienza aquí", "Vuelve a conectar con tu comunidad empresarial"], setup: "Continúa configurando tu organización en RFxchange cuando quieras.", explore: "Visita RFxchange para explorar oportunidades, recursos y capacidades empresariales.", preferences: "Gestionar preferencias", unsubscribe: "Cancelar los correos opcionales", stop: "Responde STOP para cancelar." },
  fr: { subjects: ["Poursuivez la configuration de votre organisation", "Votre prochaine relation professionnelle commence ici", "Renouez avec votre communauté professionnelle"], setup: "Poursuivez la configuration de votre organisation sur RFxchange à votre rythme.", explore: "Visitez RFxchange pour découvrir des opportunités, des ressources et des capacités professionnelles.", preferences: "Gérer les préférences", unsubscribe: "Se désabonner des e-mails facultatifs", stop: "Répondez STOP pour vous désabonner." },
  it: { subjects: ["Continua a configurare la tua organizzazione", "La tua prossima relazione commerciale inizia qui", "Ritrova la tua comunità professionale"], setup: "Continua a configurare la tua organizzazione su RFxchange quando vuoi.", explore: "Visita RFxchange per esplorare opportunità, risorse e capacità aziendali.", preferences: "Gestisci le preferenze", unsubscribe: "Annulla le email facoltative", stop: "Rispondi STOP per annullare." },
  de: { subjects: ["Richten Sie Ihre Organisation weiter ein", "Ihr nächster Geschäftskontakt beginnt hier", "Entdecken Sie Ihre Geschäftsgemeinschaft neu"], setup: "Setzen Sie die Einrichtung Ihrer Organisation auf RFxchange fort, wenn Sie bereit sind.", explore: "Besuchen Sie RFxchange, um Möglichkeiten, Ressourcen und Unternehmensfähigkeiten zu entdecken.", preferences: "Einstellungen verwalten", unsubscribe: "Optionale E-Mails abbestellen", stop: "Zum Abbestellen mit STOP antworten." },
};
/** Public-only content. Unsubscribe capabilities are included in email only. */
export function lifecycleContent(journey: LifecycleJourney, exchangeOrigin: string, options: { locale?: string; unsubscribeUrl?: string } = {}) {
  const origin = new URL(exchangeOrigin);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("A configured Exchange origin is required.");
  if (options.unsubscribeUrl) {
    const unsubscribe = new URL(options.unsubscribeUrl);
    if (unsubscribe.origin !== origin.origin || !/^\/communications\/unsubscribe\/[A-Za-z0-9_-]{43}$/.test(unsubscribe.pathname) || unsubscribe.search || unsubscribe.hash || unsubscribe.username || unsubscribe.password) throw new Error("Invalid unsubscribe destination.");
  }
  const c = copy[resolveLocale(options.locale)];
  const setup = journey === "finish-setup";
  const subject = c.subjects[setup ? 0 : journey === "retention" ? 1 : 2];
  const actionUrl = new URL(setup ? "/join" : "/opportunities", origin).href;
  const preferencesUrl = new URL("/account/communications", origin).href;
  const body = setup ? c.setup : c.explore;
  const text = `${body}\n\n${actionUrl}\n\n${c.preferences}: ${preferencesUrl}${options.unsubscribeUrl ? `\n${c.unsubscribe}: ${options.unsubscribeUrl}` : ""}`;
  return { subject, text, sms: `RFxchange: ${subject}: ${actionUrl} ${c.stop}` };
}
