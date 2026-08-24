export type ParticipantLanguageLocale = "en-US" | "es" | "fr" | "it" | "de";

const exactReplacements = new Map<string, string>([
  ["Create a governed RFx draft", "Create an RFx draft"],
  ["Governed lifecycle", "Status"],
  ["Request-type authority", "Request type"],
  ["Need, scope, location, value, requirements, readiness, and publication become available only in later governed steps.", "Continue through the draft to add need, scope, location, value, requirements, readiness, and publication details."],
  ["This first action creates only the private RFx kernel and its governed request-type snapshot.", "This creates a private RFx draft with the request type you selected."],
  ["Operational location stays private in this draft; publication visibility is a separate governed decision.", "The performance location stays private in this draft. You choose what responders can see when you publish."],
  ["Use governed capabilities and requirement types. Potential fit never means qualification or endorsement.", "Use capabilities and requirement types. Potential fit never means qualification or endorsement."],
  ["Add an RFx-specific responder section without changing the governed catalog.", "Add a response section specific to this RFx."],
  ["The server checks the current RFx, geography, authority, and responder projection before publication.", "The Exchange checks the RFx, location, your permission to publish, and responder-facing information before publication."],
  ["Projection digest", "Preview reference"],
  ["Basic issuance is included for eligible organizations. Publication is atomic and cannot be undone in this slice.", "Eligible organizations can publish an RFx. Publishing makes it available to responders and cannot currently be undone."],
  ["Publication is atomic and cannot be undone in this slice.", "Eligible organizations can publish an RFx. Publishing makes it available to responders and cannot currently be undone."],
  ["Authoritative publication", "Published RFx"],
  ["Open controlled share link", "Open share link"],
  ["This link preserves intent but grants no membership, response, invitation, or qualification authority.", "Opening this link does not give someone membership, response, invitation, or qualification access."],
  ["Authoritative RFxchange publication", "Published on RFxchange"],
  ["Publication boundary", "What responders can see"],
  ["Private locations, actors, internal notes, audit evidence, and interpretation records are excluded from this projection.", "Private locations, internal notes, review records, and interpretation details are not shown to responders."],
  ["Restore the governed AMACS request-type snapshot.", "Reconfirm the AMACS request type."],
  ["Link this evidence requirement to governed evidence.", "Link this requirement to supporting evidence."],
  ["Complete governed requirements.", "Complete the requirements."],
  ["Find real published opportunities", "Find published opportunities"],
  ["Permitted published opportunities", "Published opportunities"],
  ["No permitted opportunities match this search", "No opportunities match this search"],
  ["Broaden or clear the filters. The Exchange does not create placeholder opportunities or infer market activity.", "Broaden or clear the filters and try again."],
  ["Only real, currently permitted publications are shown.", "Only opportunities available to you are shown."],
  ["Derived from canonical response deadlines and the server clock.", "Based on the response deadlines shown on each opportunity."],
  ["Search saved with its current governed filters.", "Search saved with its current filters."],
]);

const englishPhraseReplacements: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bgoverned\s+/gi, ""],
  [/\bnon-authoritative\b/gi, "suggested"],
  [/\bauthoritative\b/gi, "confirmed"],
  [/\bserver-authorized\b/gi, "available"],
  [/\bcanonical\b/gi, "current"],
  [/\bcontrolled geography\b/gi, "selected geography"],
  [/\bcontrolled locality\b/gi, "selected locality"],
  [/\bcontrolled Network\b/gi, "Exchange"],
  [/\bprojection\b/gi, "view"],
  [/\bprovenance\b/gi, "source information"],
  [/\blifecycle\b/gi, "status"],
  [/\bWave\s+3\b/gi, "current"],
  [/\bWave\s+4\b/gi, "upcoming"],
  [/\bWave\s+\d+(?:\.\d+)?\b/gi, "upcoming"],
  [/\bSlice\s+\d+(?:\.\d+)?\b/gi, "release"],
  [/\breal published\b/gi, "published"],
  [/\breal permitted\b/gi, "available"],
  [/\breal organization(s)?\b/gi, "organization$1"],
  [/\breal map position\b/gi, "map position"],
  [/\breal market activity\b/gi, "market activity"],
  [/\bcurrent-authority\b/gi, "current"],
  [/\borganization authority\b/gi, "organization permissions"],
  [/\bissuer authority\b/gi, "issuer permissions"],
  [/\brecipient authority\b/gi, "recipient permissions"],
  [/\bprovider authority\b/gi, "provider permissions"],
  [/\bcurrent authority\b/gi, "current permissions"],
  [/\bversioned evidence\b/gi, "supporting information"],
  [/\bimplementation slice(s)?\b/gi, "release$1"],
  [/\bapproved slice(s)?\b/gi, "available feature$1"],
];

const localizedPhraseReplacements: Readonly<Record<Exclude<ParticipantLanguageLocale, "en-US">, ReadonlyArray<readonly [RegExp, string]>>> = {
  es: [
    [/\bOla\s+3\s+está\s+completa\.?/gi, ""],
    [/\bOla\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bpróxima\s+vía\s+gobernada\b/gi, "Próximas funciones"],
    [/\btrabajo\s+gobernado\s+posterior\b/gi, "funciones futuras"],
    [/\bvías\s+gobernadas\s+posteriores\b/gi, "funciones futuras"],
    [/\basistencia\s+gobernada\b/gi, "asistencia"],
    [/\bactividad\s+gobernada\b/gi, "actividad"],
    [/\brevisión\s+gobernada\b/gi, "revisión"],
    [/\bservicios\s+gobernados\b/gi, "servicios"],
    [/\bdominios\s+posteriores\b/gi, "funciones futuras"],
    [/\bestado\s+autorizado\b/gi, "información confirmada"],
    [/\borganización\s+real\b/gi, "organización"],
    [/\blugar\s+real\b/gi, "lugar"],
    [/\bposición\s+real\s+o\s+protegida\s+en\s+el\s+mapa\b/gi, "posición confirmada o protegida en el mapa"],
    [/\bactividad\s+real\s+de\s+organizaciones\b/gi, "actividad de organizaciones"],
    [/^La\s+Las organizaciones/gi, "Las organizaciones"],
    [/\bLa\s+Wave\s+3\s+está\s+completa\.?\s*/gi, ""],
    [/\bWave\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bSlice\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bparticipantes permitidos\b/gi, "organizaciones participantes"],
    [/\borganizaciones permitidas\b/gi, "organizaciones participantes"],
    [/\bcontexto autorizado\b/gi, "contexto disponible"],
    [/\bautorizad[ao] por el servidor\b/gi, "disponible"],
    [/\bgeografía autorizada por el servidor\b/gi, "geografía seleccionada"],
    [/\bgeografía controlada\b/gi, "geografía seleccionada"],
    [/\blocalidad controlada\b/gi, "localidad seleccionada"],
    [/\bRed controlada\b/gi, "Exchange"],
    [/\bciclo de vida\b/gi, "estado"],
    [/\bproyección(?:es)?\b/gi, "vista"],
    [/\bprocedencia\b/gi, "información de origen"],
    [/\bcanónic[oa]s?\b/gi, "actual"],
    [/\bno autoritativ[oa]s?\b/gi, "sugerido"],
    [/\bautoritativ[oa]s?\b/gi, "confirmado"],
    [/\bautoridad geográfica\b/gi, "configuración geográfica"],
    [/\bautoridad de emisor\b/gi, "permiso para emitir"],
    [/\bautoridad del evaluador\b/gi, "permiso para evaluar"],
    [/\bautoridad actual\b/gi, "permisos actuales"],
    [/\bflujos publicados\b/gi, "flujos disponibles"],
    [/\bregulad[ao]s?\b/gi, ""],
    [/\bgobernad[ao]s?\b/gi, ""],
  ],
  fr: [
    [/\bVague\s+3\s+est\s+terminée\.?/gi, ""],
    [/\bVague\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bprochaine\s+voie\s+gouvernée\b/gi, "Fonctionnalités à venir"],
    [/\btravail\s+gouverné\s+ultérieur\b/gi, "fonctionnalités futures"],
    [/\bvoies\s+gouvernées\s+ultérieures\b/gi, "fonctionnalités futures"],
    [/\bassistance\s+gouvernée\b/gi, "assistance"],
    [/\bactivité\s+gouvernée\b/gi, "activité"],
    [/\brévision\s+gouvernée\b/gi, "révision"],
    [/\bservices\s+gouvernés\b/gi, "services"],
    [/\bdomaines\s+ultérieurs\b/gi, "fonctionnalités futures"],
    [/\bétat\s+autorisé\b/gi, "information confirmée"],
    [/\borganisation\s+réelle\b/gi, "organisation"],
    [/\blieu\s+réel\b/gi, "lieu"],
    [/\bposition\s+réelle\s+ou\s+protégée\s+sur\s+la\s+carte\b/gi, "position confirmée ou protégée sur la carte"],
    [/^La\s+est achevée\.\s*/gi, ""],
    [/\bLa\s+Wave\s+3\s+est\s+terminée\.?\s*/gi, ""],
    [/\bWave\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bSlice\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bparticipants autorisés\b/gi, "participants"],
    [/\borganisations autorisées\b/gi, "organisations participantes"],
    [/\bcontexte autorisé\b/gi, "contexte disponible"],
    [/\bgéographie autorisée par le serveur\b/gi, "géographie sélectionnée"],
    [/\bgéographie contrôlée\b/gi, "géographie sélectionnée"],
    [/\blocalité contrôlée\b/gi, "localité sélectionnée"],
    [/\bRéseau contrôlé\b/gi, "Exchange"],
    [/\bcycle de vie\b/gi, "statut"],
    [/\bprojection(?:s)?\b/gi, "vue"],
    [/\bprovenance\b/gi, "informations sur la source"],
    [/\bcanonique(?:s)?\b/gi, "actuel"],
    [/\bautorité géographique\b/gi, "configuration géographique"],
    [/\bautorité d’émetteur\b/gi, "permission d’émettre"],
    [/\bautorité d’évaluation\b/gi, "permission d’évaluer"],
    [/\bautorité actuelle\b/gi, "autorisations actuelles"],
    [/\bflux publiés\b/gi, "flux disponibles"],
    [/\bgouverné(?:e|es|s)?\b/gi, ""],
  ],
  it: [
    [/\bOnda(?:ta)?\s+3\s+è\s+completa\.?/gi, ""],
    [/\bOnda(?:ta)?\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bprossimo\s+percorso\s+governato\b/gi, "Funzionalità in arrivo"],
    [/\blavoro\s+governato\s+successivo\b/gi, "funzionalità future"],
    [/\bpercorsi\s+governati\s+successivi\b/gi, "funzionalità future"],
    [/\bassistenza\s+governata\b/gi, "assistenza"],
    [/\battività\s+governata\b/gi, "attività"],
    [/\brevisione\s+governata\b/gi, "revisione"],
    [/\bservizi\s+governati\b/gi, "servizi"],
    [/\bdomini\s+successivi\b/gi, "funzionalità future"],
    [/\bstato\s+autorizzato\b/gi, "informazione confermata"],
    [/\borganizzazione\s+reale\b/gi, "organizzazione"],
    [/\bluogo\s+reale\b/gi, "luogo"],
    [/\bposizione\s+reale\s+o\s+protetta\s+sulla\s+mappa\b/gi, "posizione confermata o protetta sulla mappa"],
    [/\bLa\s+Wave\s+3\s+è\s+completa\.?\s*/gi, ""],
    [/\bWave\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bSlice\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bpartecipanti autorizzati\b/gi, "partecipanti"],
    [/\borganizzazioni autorizzate\b/gi, "organizzazioni partecipanti"],
    [/\bcontesto autorizzato\b/gi, "contesto disponibile"],
    [/\bgeografia autorizzata dal server\b/gi, "geografia selezionata"],
    [/\bgeografia controllata\b/gi, "geografia selezionata"],
    [/\blocalità controllata\b/gi, "località selezionata"],
    [/\bRete controllata\b/gi, "Exchange"],
    [/\bciclo di vita\b/gi, "stato"],
    [/\bproiezione(?:i)?\b/gi, "vista"],
    [/\bprovenienza\b/gi, "informazioni sulla fonte"],
    [/\bcanonic[oaie]\b/gi, "attuale"],
    [/\bnon autoritativ[oaie]\b/gi, "suggerito"],
    [/\bautoritativ[oaie]\b/gi, "confermato"],
    [/\bstato autorevole\b/gi, "informazioni confermate"],
    [/\bautorità geografica\b/gi, "configurazione geografica"],
    [/\bautorità di emittente\b/gi, "permesso di pubblicare"],
    [/\bautorità di valutazione\b/gi, "permesso di valutare"],
    [/\bautorità attuale\b/gi, "permessi attuali"],
    [/\bflussi rilasciati\b/gi, "flussi disponibili"],
    [/\bgovernat[oaie]\b/gi, ""],
  ],
  de: [
    [/\bWelle\s+3\s+ist\s+abgeschlossen\.?/gi, ""],
    [/\bWelle\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bnächster\s+geregelter\s+Pfad\b/gi, "Kommende Funktionen"],
    [/\bspätere\s+geregelte\s+Arbeit\b/gi, "künftige Funktionen"],
    [/\bspätere\s+geregelte\s+Pfade\b/gi, "künftige Funktionen"],
    [/\bgeregelte\s+Unterstützung\b/gi, "Unterstützung"],
    [/\bgeregelte\s+Aktivität\b/gi, "Aktivität"],
    [/\bgeregelte\s+Prüfung\b/gi, "Prüfung"],
    [/\bgeregelte\s+Dienstleistungen\b/gi, "Dienstleistungen"],
    [/\bspätere\s+Domänen\b/gi, "künftige Funktionen"],
    [/\bverbindlicher\s+Zustand\b/gi, "bestätigte Information"],
    [/\breale\s+Organisation\b/gi, "Organisation"],
    [/\brealen\s+Organisation\b/gi, "Organisation"],
    [/\brealer\s+Ort\b/gi, "Ort"],
    [/\brealen\s+Ort\b/gi, "Ort"],
    [/\breale\s+oder\s+datenschutzgerechte\s+Kartenposition\b/gi, "bestätigte oder datenschutzgerechte Kartenposition"],
    [/\bWave\s+3\s+ist\s+abgeschlossen\.?\s*/gi, ""],
    [/\bWave\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bSlice\s+\d+(?:\.\d+)?\b/gi, ""],
    [/\bzulässige Teilnehmer\b/gi, "teilnehmende Organisationen"],
    [/\bzulässige Organisationen\b/gi, "teilnehmende Organisationen"],
    [/\bautorisierter Kontext\b/gi, "verfügbarer Kontext"],
    [/\bserverseitig autorisierte Geografie\b/gi, "ausgewählte Geografie"],
    [/\bkontrollierte Geografie\b/gi, "ausgewählte Geografie"],
    [/\bkontrollierter Ort\b/gi, "ausgewählter Ort"],
    [/\bkontrolliertes Netzwerk\b/gi, "Exchange"],
    [/\bLebenszyklusstatus\b/gi, "Status"],
    [/\bLebenszyklus\b/gi, "Status"],
    [/\bProjektion(?:en)?\b/gi, "Ansicht"],
    [/\bHerkunft\b/gi, "Quellenangaben"],
    [/\bkanonisch(?:e|en|er|es)?\b/gi, "aktuell"],
    [/\bnicht autoritativ\b/gi, "vorgeschlagen"],
    [/\bAutorität\b/gi, "Berechtigung"],
    [/\bgeregelte[nmrs]?\b/gi, ""],
  ],
};

function cleanSpacing(value: string): string {
  return value
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^\s*[.;,:-]+\s*/, "")
    .trim();
}

export function rewriteParticipantText(value: string, locale: ParticipantLanguageLocale = "en-US"): string {
  let next = locale === "en-US" ? (exactReplacements.get(value) ?? value) : value;
  const replacements = locale === "en-US"
    ? englishPhraseReplacements
    : localizedPhraseReplacements[locale];

  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  return cleanSpacing(next);
}

export function applyParticipantLanguageFirewall<T>(value: T, locale: ParticipantLanguageLocale = "en-US"): T {
  if (typeof value === "string") {
    return rewriteParticipantText(value, locale) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyParticipantLanguageFirewall(item, locale)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        applyParticipantLanguageFirewall(item, locale),
      ]),
    ) as T;
  }

  return value;
}
