export const OPPORTUNITY_ALERT_LOCALES = [
  "en-US",
  "es",
  "fr",
  "it",
  "de",
] as const;

export type OpportunityAlertLocale =
  (typeof OPPORTUNITY_ALERT_LOCALES)[number];

interface OpportunityAlertMessageInput {
  readonly recipient: string;
  readonly count: number;
  readonly summary: string;
  readonly continueUrl: string;
}

interface OpportunityAlertMessage {
  readonly subject: string;
  readonly text: string;
}

type OpportunityAlertMessageFactory = (
  input: OpportunityAlertMessageInput,
) => OpportunityAlertMessage;

const opportunityAlertMessageCatalog: Readonly<
  Record<OpportunityAlertLocale, OpportunityAlertMessageFactory>
> = Object.freeze({
  "en-US": ({ recipient, count, summary, continueUrl }) => Object.freeze({
    subject: `${count} RFx opportunity update${count === 1 ? "" : "s"}`,
    text: `Hello ${recipient},\n\nA saved RFx search found ${count} currently permitted opportunity update${count === 1 ? "" : "s"}:\n\n${summary}\n\nReview the current details securely: ${continueUrl}\n\nA saved-search match is not qualification, eligibility, endorsement, or an award prediction.`,
  }),
  es: ({ recipient, count, summary, continueUrl }) => Object.freeze({
    subject: `${count} actualización${count === 1 ? "" : "es"} de oportunidades RFx`,
    text: `Hola ${recipient},\n\nUna búsqueda de RFx guardada encontró ${count} ${count === 1 ? "actualización de oportunidad actualmente permitida" : "actualizaciones de oportunidades actualmente permitidas"}:\n\n${summary}\n\nRevise de forma segura los detalles actuales: ${continueUrl}\n\nUna coincidencia de búsqueda guardada no constituye cualificación, elegibilidad, respaldo ni una predicción de adjudicación.`,
  }),
  fr: ({ recipient, count, summary, continueUrl }) => Object.freeze({
    subject: `${count} mise${count === 1 ? "" : "s"} à jour d’opportunité${count === 1 ? "" : "s"} RFx`,
    text: `Bonjour ${recipient},\n\nUne recherche RFx enregistrée a trouvé ${count} ${count === 1 ? "mise à jour d’opportunité actuellement autorisée" : "mises à jour d’opportunités actuellement autorisées"} :\n\n${summary}\n\nConsultez les informations actuelles de manière sécurisée : ${continueUrl}\n\nUne correspondance de recherche enregistrée ne constitue ni une qualification, ni une admissibilité, ni une approbation, ni une prédiction d’attribution.`,
  }),
  it: ({ recipient, count, summary, continueUrl }) => Object.freeze({
    subject: `${count} aggiornamento${count === 1 ? "" : "i"} di opportunità RFx`,
    text: `Ciao ${recipient},\n\nUna ricerca RFx salvata ha trovato ${count} ${count === 1 ? "aggiornamento di opportunità attualmente consentito" : "aggiornamenti di opportunità attualmente consentiti"}:\n\n${summary}\n\nEsamina in modo sicuro i dettagli correnti: ${continueUrl}\n\nUna corrispondenza di ricerca salvata non costituisce qualificazione, idoneità, approvazione o previsione di aggiudicazione.`,
  }),
  de: ({ recipient, count, summary, continueUrl }) => Object.freeze({
    subject: `${count} RFx-Chancenaktualisierung${count === 1 ? "" : "en"}`,
    text: `Hallo ${recipient},\n\nEine gespeicherte RFx-Suche hat ${count} ${count === 1 ? "derzeit zulässige Chancenaktualisierung" : "derzeit zulässige Chancenaktualisierungen"} gefunden:\n\n${summary}\n\nPrüfen Sie die aktuellen Details sicher: ${continueUrl}\n\nEin Treffer einer gespeicherten Suche stellt weder eine Qualifikation noch eine Berechtigung, Empfehlung oder Zuschlagsprognose dar.`,
  }),
});

export function normalizeOpportunityAlertLocale(
  value: unknown,
): OpportunityAlertLocale {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (candidate === "en-US" || /^en(?:-|$)/i.test(candidate)) return "en-US";
  if (candidate === "es" || /^es(?:-|$)/i.test(candidate)) return "es";
  if (candidate === "fr" || /^fr(?:-|$)/i.test(candidate)) return "fr";
  if (candidate === "it" || /^it(?:-|$)/i.test(candidate)) return "it";
  if (candidate === "de" || /^de(?:-|$)/i.test(candidate)) return "de";
  return "en-US";
}

export function renderOpportunityAlertMessage(
  locale: OpportunityAlertLocale,
  input: OpportunityAlertMessageInput,
): OpportunityAlertMessage {
  return opportunityAlertMessageCatalog[locale](input);
}
