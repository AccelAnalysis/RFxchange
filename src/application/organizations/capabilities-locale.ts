import type { Locale } from "../../i18n/config.ts";

import type { CapabilityCardCopy } from "./capabilities-exchange.ts";

export interface CapabilitiesCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly introduction: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly serviceAreaLabel: string;
  readonly evidenceLabel: string;
  readonly submitSearch: string;
  readonly resultsTitle: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly closeDetail: string;
  readonly assertionsTitle: string;
  readonly evidenceStatus: string;
  readonly serviceCoverage: string;
  readonly specialties: string;
  readonly noSpecialties: string;
  readonly noCoverage: string;
  readonly gapsTitle: string;
  readonly noGaps: string;
  readonly gapLabels: Readonly<Record<string, string>>;
  readonly catalogTitle: string;
  readonly catalogIntroduction: string;
  readonly catalogSearchLabel: string;
  readonly catalogDomainLabel: string;
  readonly catalogSubmit: string;
  readonly catalogEmpty: string;
  readonly provenance: string;
  readonly comparisonTitle: string;
  readonly comparisonRemove: string;
  readonly comparisonDisclaimer: string;
  readonly ownOrganization: string;
  readonly externalOrganization: string;
  readonly readiness: Readonly<Record<string, string>>;
  readonly card: CapabilityCardCopy;
}

const en: CapabilitiesCopy = Object.freeze({
  eyebrow: "Capabilities · RFxchange",
  title: "Capability exchange",
  introduction: "Discover organization-claimed capabilities classified against the current AMACS release. Capability visibility is not qualification, verification, or an RFx match.",
  searchLabel: "Search capability or organization",
  searchPlaceholder: "Capability, specialty, or organization",
  serviceAreaLabel: "Service area",
  evidenceLabel: "Evidence state",
  submitSearch: "Search",
  resultsTitle: "Organizations",
  emptyTitle: "No capability profiles found",
  emptyBody: "No permitted organization has a confirmed structured capability matching these filters.",
  closeDetail: "Close capability detail",
  assertionsTitle: "Organization-claimed capabilities",
  evidenceStatus: "Evidence state",
  serviceCoverage: "Service coverage",
  specialties: "Specialties",
  noSpecialties: "None recorded",
  noCoverage: "No service geography recorded",
  gapsTitle: "Capability record gaps",
  noGaps: "No structural gaps detected in the current confirmed assertions.",
  gapLabels: Object.freeze({ "no-claims": "No confirmed capability assertion", "historical-amacs": "Historical AMACS concept", coverage: "Service coverage missing", "market-role": "Market role missing", evidence: "No evidence submitted" }),
  catalogTitle: "Browse AMACS manually",
  catalogIntroduction: "Search the pinned AMACS catalog directly. Browsing does not add or confirm an organization capability.",
  catalogSearchLabel: "AMACS search",
  catalogDomainLabel: "AMACS domain",
  catalogSubmit: "Browse",
  catalogEmpty: "Enter a term or choose a domain to browse canonical concepts.",
  provenance: "Pinned classification source",
  comparisonTitle: "Permitted comparison",
  comparisonRemove: "Remove comparison",
  comparisonDisclaimer: "This compares disclosed capability facts only. It does not score, qualify, recommend, or match an organization to an RFx.",
  ownOrganization: "Your organization",
  externalOrganization: "Network organization",
  readiness: Object.freeze({ structured: "Structured", "needs-review": "Needs review", "not-ready": "Not ready" }),
  card: Object.freeze({
    viewAccessible: "View capability assertions for {organization}", emptySummary: "No current AMACS-backed capability assertion is available.", assertions: "Capability assertions", capability: "AMACS capability", classification: "Classification", evidenceSubmitted: "Evidence submitted", verifiedAssertions: "Verified assertions", currentRelease: "AMACS {version}", historicalRelease: "Historical AMACS snapshot present",
  }),
});

function translated(locale: Locale): CapabilitiesCopy {
  if (locale === "es") return Object.freeze({ ...en, eyebrow: "Capacidades · RFxchange", title: "Intercambio de capacidades", introduction: "Descubra capacidades declaradas por organizaciones y clasificadas con la versión actual de AMACS. La visibilidad no implica calificación, verificación ni coincidencia con un RFx.", searchLabel: "Buscar capacidad u organización", searchPlaceholder: "Capacidad, especialidad u organización", serviceAreaLabel: "Área de servicio", evidenceLabel: "Estado de evidencia", submitSearch: "Buscar", resultsTitle: "Organizaciones", emptyTitle: "No se encontraron perfiles", emptyBody: "Ninguna organización permitida tiene una capacidad estructurada confirmada que coincida.", closeDetail: "Cerrar detalle", assertionsTitle: "Capacidades declaradas por la organización", catalogTitle: "Explorar AMACS manualmente", catalogIntroduction: "Busque directamente en el catálogo AMACS fijado. Explorar no agrega ni confirma capacidades.", catalogSearchLabel: "Buscar en AMACS", catalogDomainLabel: "Dominio AMACS", catalogSubmit: "Explorar", catalogEmpty: "Ingrese un término o elija un dominio.", comparisonTitle: "Comparación permitida", comparisonDisclaimer: "Esta comparación solo muestra hechos divulgados. No puntúa, califica, recomienda ni empareja con un RFx.", ownOrganization: "Su organización", externalOrganization: "Organización de la red" });
  if (locale === "fr") return Object.freeze({ ...en, eyebrow: "Capacités · RFxchange", title: "Échange de capacités", introduction: "Découvrez les capacités déclarées par les organisations et classées selon la version AMACS actuelle. La visibilité ne constitue ni qualification, ni vérification, ni correspondance RFx.", searchLabel: "Rechercher une capacité ou une organisation", searchPlaceholder: "Capacité, spécialité ou organisation", serviceAreaLabel: "Zone de service", evidenceLabel: "État des preuves", submitSearch: "Rechercher", resultsTitle: "Organisations", emptyTitle: "Aucun profil trouvé", emptyBody: "Aucune organisation autorisée ne possède de capacité structurée confirmée correspondant aux filtres.", closeDetail: "Fermer le détail", assertionsTitle: "Capacités déclarées par l’organisation", catalogTitle: "Parcourir AMACS manuellement", catalogIntroduction: "Recherchez directement dans le catalogue AMACS épinglé. La consultation n’ajoute ni ne confirme une capacité.", catalogSearchLabel: "Recherche AMACS", catalogDomainLabel: "Domaine AMACS", catalogSubmit: "Parcourir", catalogEmpty: "Saisissez un terme ou choisissez un domaine.", comparisonTitle: "Comparaison autorisée", comparisonDisclaimer: "Cette comparaison porte uniquement sur les faits divulgués. Elle ne note, qualifie, recommande ni associe à un RFx.", ownOrganization: "Votre organisation", externalOrganization: "Organisation du réseau" });
  if (locale === "it") return Object.freeze({ ...en, eyebrow: "Capacità · RFxchange", title: "Scambio di capacità", introduction: "Scopri le capacità dichiarate dalle organizzazioni e classificate con la versione AMACS corrente. La visibilità non equivale a qualificazione, verifica o corrispondenza RFx.", searchLabel: "Cerca capacità o organizzazione", searchPlaceholder: "Capacità, specialità o organizzazione", serviceAreaLabel: "Area di servizio", evidenceLabel: "Stato delle prove", submitSearch: "Cerca", resultsTitle: "Organizzazioni", emptyTitle: "Nessun profilo trovato", emptyBody: "Nessuna organizzazione autorizzata dispone di una capacità strutturata confermata corrispondente.", closeDetail: "Chiudi dettaglio", assertionsTitle: "Capacità dichiarate dall’organizzazione", catalogTitle: "Sfoglia AMACS manualmente", catalogIntroduction: "Cerca direttamente nel catalogo AMACS fissato. La consultazione non aggiunge né conferma capacità.", catalogSearchLabel: "Ricerca AMACS", catalogDomainLabel: "Dominio AMACS", catalogSubmit: "Sfoglia", catalogEmpty: "Inserisci un termine o scegli un dominio.", comparisonTitle: "Confronto consentito", comparisonDisclaimer: "Il confronto mostra solo fatti divulgati. Non assegna punteggi, qualifica, raccomanda o abbina a un RFx.", ownOrganization: "La tua organizzazione", externalOrganization: "Organizzazione della rete" });
  if (locale === "de") return Object.freeze({ ...en, eyebrow: "Fähigkeiten · RFxchange", title: "Fähigkeitsaustausch", introduction: "Entdecken Sie von Organisationen angegebene und nach der aktuellen AMACS-Version klassifizierte Fähigkeiten. Sichtbarkeit bedeutet weder Qualifizierung noch Verifizierung oder RFx-Zuordnung.", searchLabel: "Fähigkeit oder Organisation suchen", searchPlaceholder: "Fähigkeit, Spezialisierung oder Organisation", serviceAreaLabel: "Servicegebiet", evidenceLabel: "Nachweisstatus", submitSearch: "Suchen", resultsTitle: "Organisationen", emptyTitle: "Keine Profile gefunden", emptyBody: "Keine zulässige Organisation hat eine passende bestätigte strukturierte Fähigkeit.", closeDetail: "Details schließen", assertionsTitle: "Von der Organisation angegebene Fähigkeiten", catalogTitle: "AMACS manuell durchsuchen", catalogIntroduction: "Durchsuchen Sie den festgelegten AMACS-Katalog direkt. Das Browsen fügt keine Fähigkeit hinzu und bestätigt keine.", catalogSearchLabel: "AMACS-Suche", catalogDomainLabel: "AMACS-Domäne", catalogSubmit: "Durchsuchen", catalogEmpty: "Geben Sie einen Begriff ein oder wählen Sie eine Domäne.", comparisonTitle: "Zulässiger Vergleich", comparisonDisclaimer: "Dieser Vergleich zeigt nur offengelegte Fakten. Er bewertet, qualifiziert, empfiehlt oder ordnet keine Organisation einem RFx zu.", ownOrganization: "Ihre Organisation", externalOrganization: "Netzwerkorganisation" });
  return en;
}

export function capabilitiesLocaleCatalog(locale: Locale): CapabilitiesCopy {
  return translated(locale);
}
