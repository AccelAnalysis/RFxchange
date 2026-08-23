import type { ParticipantMapCamera } from "../geography/map-view.ts";
import {
  createExchangeGeographyContext,
  createExchangeMapAreaProjection,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  mobileLensActionRail,
  projectFavoriteState,
  projectRecordAction,
  type ExchangeMapAreaProjection,
  type ExchangeResultSpatialDisposition,
  type ExchangeSelectionSource,
  type ExchangeSelectionState,
  type LensActionRailContract,
  type LensDiscoveryProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  exchangeRoomActionDefinitionsForLens,
  type ExchangeRoomActionDisabledReason,
  type ExchangeRoomActionProjection,
} from "../participant/exchange-room-actions.ts";
import type { Locale } from "../../i18n/config.ts";
import type {
  ProviderDiscoveryProjection,
  ProviderResourceProjection,
  ProviderServiceTerritoryProjection,
} from "../../domain/resource-network/model.ts";
import type { RecipientReferralProjection, SenderReferralProjection } from "../../domain/referrals/model.ts";
import { matchesResourceDiscoveryTerms, resourceDiscoveryTerms } from "./resource-discovery-query.ts";

type RequestProjection = SenderReferralProjection | RecipientReferralProjection;
type ProviderRequest = RequestProjection & Readonly<{
  purpose: "provider-connection";
  providerContext: NonNullable<RequestProjection["providerContext"]>;
}>;

export interface ResourcesMobileAuthorization {
  readonly openPlatform: boolean;
  readonly referralManage: boolean;
  readonly resourceManage: boolean;
}

export interface ResourcesMobileSelectionInput {
  readonly providerOrganizationId?: string | null;
  readonly resourceId?: string | null;
  readonly requestId?: string | null;
  readonly source?: ExchangeSelectionSource;
}

export interface ResourcesMobileNavigationContext {
  readonly query?: string | null;
  readonly availability?: string | null;
  readonly rfxReference?: string | null;
  readonly rfxGap?: string | null;
  readonly returnTo?: string | null;
}

export interface ResourcesMobileServiceTerritoryBinding {
  readonly providerOrganizationId: string;
  readonly area: ExchangeMapAreaProjection;
  readonly geometryReference: string;
  readonly geometry: ProviderServiceTerritoryProjection["geometry"];
}

export interface ResourcesMobileProjection {
  readonly discovery: LensDiscoveryProjection;
  readonly selection: ExchangeSelectionState;
  readonly actionRail: LensActionRailContract;
  readonly serviceTerritories: readonly ResourcesMobileServiceTerritoryBinding[];
  readonly providerCards: readonly LensResultCardModel[];
  readonly resourceCards: readonly LensResultCardModel[];
  readonly requestCards: readonly LensResultCardModel[];
}

export const RESOURCES_MOBILE_LAYER_IDS = Object.freeze({
  providers: "resources.providers",
  serviceTerritories: "resources.service-territories",
} as const);

export const RESOURCES_MOBILE_RECORD_ACTION_KEYS = Object.freeze({
  viewProvider: "resources.recordActions.viewProvider",
  viewResource: "resources.recordActions.viewResource",
  requestSupport: "resources.recordActions.requestSupport",
  viewRequest: "resources.recordActions.viewRequest",
} as const);

const COPY = Object.freeze({
  "en-US": Object.freeze({ results: "Resources", empty: "No published resources or providers match these filters.", available: "Availability", services: "Services", eligibility: "Eligibility", official: "Official Resource Provider", request: "Provider request", fallback: "Resource information", context: "RFx resource gap context", return: "Return to RFx", contextOnly: "Context only. Provider eligibility and authority are revalidated independently.", peek: "Peek", partial: "Partial", expanded: "Expanded", open: "Open", save: "Save", remove: "Remove", unavailable: "Unavailable", allStates: "All maintained states", availableState: "Available", limitedState: "Limited", unknownState: "Unknown", searchPlaceholder: "Capital, workshops, assistance…", providerResults: "Provider results", broaderSearch: "Try broader terms or another maintained availability state.", selectProvider: "Select a provider to see its published services and territory.", selectProviderCard: "Select a provider card to see its published services and territory.", eligibilityLabel: "Eligibility", intakeLabel: "Intake", languagesLabel: "Languages", modalitiesLabel: "Modalities", serviceLabel: "Service", needLabel: "What do you need?", consentPrefix: "Share my organization name and this summary only with", sendRequest: "Send provider request", requestAuthority: "Sending a private provider request requires current referral authority.", territoriesTitle: "Service territories", servesPrefix: "Serves", territoryExplanation: "this field is separate from the provider’s office marker.", resourcesTitle: "Published resources", viewResource: "View resource detail", descriptionLabel: "Description", openIntake: "Open intake information", contactProvider: "Contact the provider through RFxchange for current intake information.", requestsTitle: "Provider requests", requestRestricted: "Provider requests require current referral authority.", requestUnavailable: "Private provider requests could not be loaded. Public provider and resource discovery remains available.", noRequests: "No provider requests yet.", selectRequest: "Select a provider request card to view its private communication.", managementUnavailable: "Provider management could not be loaded. Refresh before making provider changes.", communicationTitle: "Request communication history", accept: "Accept", decline: "Decline", suggestProvider: "Suggest another published provider", suggestedProviderLabel: "Suggested provider", chooseProvider: "Choose provider", reason: "Reason", redirect: "Redirect", privateMessage: "Private request message", addMessage: "Add message", managementTitle: "Manage provider discovery and resources", publicationTitle: "Discovery publication", publicationNote: "Private profile changes do not publish automatically. Choose exactly which current services are discoverable.", withdrawBeforeEdit: "Withdraw discovery before editing", publishServices: "Publish selected services", createDraft: "Create resource draft", typeLabel: "Type", titleLabel: "Title", summaryLabel: "Summary", intakeUrlLabel: "Intake URL", visibilityLabel: "Visibility", networkVisibility: "RFxchange network", publicVisibility: "Permitted public projection", saveDraft: "Save draft", yourResources: "Your resources", withdraw: "Withdraw", publish: "Publish", inviteTitle: "Invite a provider to complete a profile", recipientName: "Recipient name", emailLabel: "Email", contextLabel: "Context", issueInvitation: "Issue invitation" }),
  es: Object.freeze({ results: "Recursos", empty: "Ningún recurso o proveedor publicado coincide con estos filtros.", available: "Disponibilidad", services: "Servicios", eligibility: "Elegibilidad", official: "Proveedor oficial de recursos", request: "Solicitud al proveedor", fallback: "Información del recurso", context: "Contexto de la brecha de recursos de RFx", return: "Volver a RFx", contextOnly: "Solo contexto. La elegibilidad y la autoridad del proveedor se revalidan por separado.", peek: "Vista previa", partial: "Parcial", expanded: "Expandido", open: "Abrir", save: "Guardar", remove: "Quitar", unavailable: "No disponible", allStates: "Todos los estados mantenidos", availableState: "Disponible", limitedState: "Limitado", unknownState: "Desconocido", searchPlaceholder: "Capital, talleres, asistencia…", providerResults: "Resultados de proveedores", broaderSearch: "Prueba términos más amplios u otro estado de disponibilidad mantenido.", selectProvider: "Selecciona un proveedor para ver sus servicios publicados y territorio.", selectProviderCard: "Selecciona una tarjeta de proveedor para ver sus servicios publicados y territorio.", eligibilityLabel: "Elegibilidad", intakeLabel: "Admisión", languagesLabel: "Idiomas", modalitiesLabel: "Modalidades", serviceLabel: "Servicio", needLabel: "¿Qué necesitas?", consentPrefix: "Compartir el nombre de mi organización y este resumen solo con", sendRequest: "Enviar solicitud al proveedor", requestAuthority: "Enviar una solicitud privada al proveedor requiere autoridad de referidos vigente.", territoriesTitle: "Territorios de servicio", servesPrefix: "Presta servicio en", territoryExplanation: "este campo es distinto del marcador de oficina del proveedor.", resourcesTitle: "Recursos publicados", viewResource: "Ver detalles del recurso", descriptionLabel: "Descripción", openIntake: "Abrir información de admisión", contactProvider: "Contacta al proveedor mediante RFxchange para obtener información de admisión vigente.", requestsTitle: "Solicitudes a proveedores", requestRestricted: "Las solicitudes a proveedores requieren autoridad de referidos vigente.", requestUnavailable: "No se pudieron cargar las solicitudes privadas. El descubrimiento público sigue disponible.", noRequests: "Aún no hay solicitudes a proveedores.", selectRequest: "Selecciona una tarjeta de solicitud para ver su comunicación privada.", managementUnavailable: "No se pudo cargar la gestión de proveedores. Actualiza antes de realizar cambios.", communicationTitle: "Historial de comunicación de la solicitud", accept: "Aceptar", decline: "Rechazar", suggestProvider: "Sugerir otro proveedor publicado", chooseProvider: "Elegir proveedor", reason: "Motivo", redirect: "Redirigir", privateMessage: "Mensaje privado de la solicitud", addMessage: "Añadir mensaje", managementTitle: "Gestionar descubrimiento y recursos", publicationTitle: "Publicación de descubrimiento", publicationNote: "Los cambios privados del perfil no se publican automáticamente. Elige los servicios actuales que serán visibles.", withdrawBeforeEdit: "Retirar el descubrimiento antes de editar", publishServices: "Publicar servicios seleccionados", createDraft: "Crear borrador de recurso", typeLabel: "Tipo", titleLabel: "Título", summaryLabel: "Resumen", intakeUrlLabel: "URL de admisión", visibilityLabel: "Visibilidad", networkVisibility: "Red RFxchange", publicVisibility: "Proyección pública permitida", saveDraft: "Guardar borrador", yourResources: "Tus recursos", withdraw: "Retirar", publish: "Publicar", inviteTitle: "Invitar a un proveedor a completar su perfil", recipientName: "Nombre del destinatario", emailLabel: "Correo electrónico", contextLabel: "Contexto", issueInvitation: "Emitir invitación" }),
  fr: Object.freeze({ results: "Ressources", empty: "Aucune ressource ni aucun fournisseur publié ne correspond à ces filtres.", available: "Disponibilité", services: "Services", eligibility: "Admissibilité", official: "Fournisseur officiel de ressources", request: "Demande au fournisseur", fallback: "Informations sur la ressource", context: "Contexte du besoin de ressources RFx", return: "Retour au RFx", contextOnly: "Contexte uniquement. L’admissibilité et l’autorité du fournisseur sont revalidées séparément.", peek: "Aperçu", partial: "Partiel", expanded: "Développé", open: "Ouvrir", save: "Enregistrer", remove: "Retirer", unavailable: "Indisponible", allStates: "Tous les états maintenus", availableState: "Disponible", limitedState: "Limitée", unknownState: "Inconnue", searchPlaceholder: "Capital, ateliers, accompagnement…", providerResults: "Résultats des fournisseurs", broaderSearch: "Essayez des termes plus généraux ou un autre état de disponibilité maintenu.", selectProvider: "Sélectionnez un fournisseur pour voir ses services publiés et son territoire.", selectProviderCard: "Sélectionnez une fiche fournisseur pour voir ses services publiés et son territoire.", eligibilityLabel: "Admissibilité", intakeLabel: "Admission", languagesLabel: "Langues", modalitiesLabel: "Modalités", serviceLabel: "Service", needLabel: "De quoi avez-vous besoin ?", consentPrefix: "Partager le nom de mon organisation et ce résumé uniquement avec", sendRequest: "Envoyer la demande", requestAuthority: "L’envoi d’une demande privée exige une autorisation de recommandation actuelle.", territoriesTitle: "Territoires de service", servesPrefix: "Dessert", territoryExplanation: "cette zone est distincte du marqueur de bureau du fournisseur.", resourcesTitle: "Ressources publiées", viewResource: "Voir le détail de la ressource", descriptionLabel: "Description", openIntake: "Ouvrir les informations d’admission", contactProvider: "Contactez le fournisseur via RFxchange pour les informations d’admission actuelles.", requestsTitle: "Demandes aux fournisseurs", requestRestricted: "Les demandes aux fournisseurs exigent une autorisation de recommandation actuelle.", requestUnavailable: "Les demandes privées n’ont pas pu être chargées. La découverte publique reste disponible.", noRequests: "Aucune demande au fournisseur pour le moment.", selectRequest: "Sélectionnez une fiche de demande pour consulter sa communication privée.", managementUnavailable: "La gestion des fournisseurs n’a pas pu être chargée. Actualisez avant toute modification.", communicationTitle: "Historique des communications de la demande", accept: "Accepter", decline: "Refuser", suggestProvider: "Suggérer un autre fournisseur publié", chooseProvider: "Choisir un fournisseur", reason: "Motif", redirect: "Réorienter", privateMessage: "Message privé de la demande", addMessage: "Ajouter un message", managementTitle: "Gérer la découverte et les ressources", publicationTitle: "Publication de découverte", publicationNote: "Les modifications privées du profil ne sont pas publiées automatiquement. Choisissez les services actuels à rendre visibles.", withdrawBeforeEdit: "Retirer la découverte avant modification", publishServices: "Publier les services sélectionnés", createDraft: "Créer un brouillon de ressource", typeLabel: "Type", titleLabel: "Titre", summaryLabel: "Résumé", intakeUrlLabel: "URL d’admission", visibilityLabel: "Visibilité", networkVisibility: "Réseau RFxchange", publicVisibility: "Projection publique autorisée", saveDraft: "Enregistrer le brouillon", yourResources: "Vos ressources", withdraw: "Retirer", publish: "Publier", inviteTitle: "Inviter un fournisseur à compléter son profil", recipientName: "Nom du destinataire", emailLabel: "E-mail", contextLabel: "Contexte", issueInvitation: "Émettre l’invitation" }),
  de: Object.freeze({ results: "Ressourcen", empty: "Keine veröffentlichten Ressourcen oder Anbieter entsprechen diesen Filtern.", available: "Verfügbarkeit", services: "Leistungen", eligibility: "Berechtigung", official: "Offizieller Ressourcenanbieter", request: "Anbieteranfrage", fallback: "Ressourceninformationen", context: "Kontext der RFx-Ressourcenlücke", return: "Zurück zum RFx", contextOnly: "Nur Kontext. Anbieterberechtigung und Befugnis werden unabhängig erneut geprüft.", peek: "Vorschau", partial: "Teilweise", expanded: "Erweitert", open: "Öffnen", save: "Speichern", remove: "Entfernen", unavailable: "Nicht verfügbar", allStates: "Alle gepflegten Zustände", availableState: "Verfügbar", limitedState: "Begrenzt", unknownState: "Unbekannt", searchPlaceholder: "Kapital, Workshops, Unterstützung…", providerResults: "Anbieterergebnisse", broaderSearch: "Versuchen Sie allgemeinere Begriffe oder einen anderen gepflegten Verfügbarkeitsstatus.", selectProvider: "Wählen Sie einen Anbieter aus, um veröffentlichte Leistungen und Gebiet zu sehen.", selectProviderCard: "Wählen Sie eine Anbieterkarte aus, um veröffentlichte Leistungen und Gebiet zu sehen.", eligibilityLabel: "Berechtigung", intakeLabel: "Aufnahme", languagesLabel: "Sprachen", modalitiesLabel: "Modalitäten", serviceLabel: "Leistung", needLabel: "Was benötigen Sie?", consentPrefix: "Namen meiner Organisation und diese Zusammenfassung nur teilen mit", sendRequest: "Anbieteranfrage senden", requestAuthority: "Eine private Anbieteranfrage erfordert aktuelle Empfehlungsberechtigung.", territoriesTitle: "Leistungsgebiete", servesPrefix: "Bedient", territoryExplanation: "dieses Gebiet ist vom Bürostandort des Anbieters getrennt.", resourcesTitle: "Veröffentlichte Ressourcen", viewResource: "Ressourcendetails anzeigen", descriptionLabel: "Beschreibung", openIntake: "Aufnahmeinformationen öffnen", contactProvider: "Kontaktieren Sie den Anbieter über RFxchange für aktuelle Aufnahmeinformationen.", requestsTitle: "Anbieteranfragen", requestRestricted: "Anbieteranfragen erfordern aktuelle Empfehlungsberechtigung.", requestUnavailable: "Private Anbieteranfragen konnten nicht geladen werden. Die öffentliche Suche bleibt verfügbar.", noRequests: "Noch keine Anbieteranfragen.", selectRequest: "Wählen Sie eine Anfragekarte, um die private Kommunikation anzuzeigen.", managementUnavailable: "Die Anbieterverwaltung konnte nicht geladen werden. Aktualisieren Sie vor Änderungen.", communicationTitle: "Kommunikationsverlauf der Anfrage", accept: "Annehmen", decline: "Ablehnen", suggestProvider: "Anderen veröffentlichten Anbieter vorschlagen", chooseProvider: "Anbieter auswählen", reason: "Grund", redirect: "Weiterleiten", privateMessage: "Private Anfragenachricht", addMessage: "Nachricht hinzufügen", managementTitle: "Anbietersuche und Ressourcen verwalten", publicationTitle: "Suchveröffentlichung", publicationNote: "Private Profiländerungen werden nicht automatisch veröffentlicht. Wählen Sie die aktuell sichtbaren Leistungen aus.", withdrawBeforeEdit: "Suche vor Bearbeitung zurückziehen", publishServices: "Ausgewählte Leistungen veröffentlichen", createDraft: "Ressourcenentwurf erstellen", typeLabel: "Typ", titleLabel: "Titel", summaryLabel: "Zusammenfassung", intakeUrlLabel: "Aufnahme-URL", visibilityLabel: "Sichtbarkeit", networkVisibility: "RFxchange-Netzwerk", publicVisibility: "Zulässige öffentliche Projektion", saveDraft: "Entwurf speichern", yourResources: "Ihre Ressourcen", withdraw: "Zurückziehen", publish: "Veröffentlichen", inviteTitle: "Anbieter zum Ausfüllen des Profils einladen", recipientName: "Name des Empfängers", emailLabel: "E-Mail", contextLabel: "Kontext", issueInvitation: "Einladung ausstellen" }),
  it: Object.freeze({ results: "Risorse", empty: "Nessuna risorsa o fornitore pubblicato corrisponde a questi filtri.", available: "Disponibilità", services: "Servizi", eligibility: "Idoneità", official: "Fornitore ufficiale di risorse", request: "Richiesta al fornitore", fallback: "Informazioni sulla risorsa", context: "Contesto del divario di risorse RFx", return: "Torna alla RFx", contextOnly: "Solo contesto. L’idoneità e l’autorità del fornitore vengono riconvalidate separatamente.", peek: "Anteprima", partial: "Parziale", expanded: "Espanso", open: "Apri", save: "Salva", remove: "Rimuovi", unavailable: "Non disponibile", allStates: "Tutti gli stati mantenuti", availableState: "Disponibile", limitedState: "Limitata", unknownState: "Sconosciuta", searchPlaceholder: "Capitale, workshop, assistenza…", providerResults: "Risultati dei fornitori", broaderSearch: "Prova termini più ampi o un altro stato di disponibilità mantenuto.", selectProvider: "Seleziona un fornitore per vedere servizi pubblicati e territorio.", selectProviderCard: "Seleziona una scheda fornitore per vedere servizi pubblicati e territorio.", eligibilityLabel: "Idoneità", intakeLabel: "Accesso", languagesLabel: "Lingue", modalitiesLabel: "Modalità", serviceLabel: "Servizio", needLabel: "Di cosa hai bisogno?", consentPrefix: "Condividi il nome della mia organizzazione e questo riepilogo solo con", sendRequest: "Invia richiesta al fornitore", requestAuthority: "L’invio di una richiesta privata richiede un’autorizzazione referral corrente.", territoriesTitle: "Territori di servizio", servesPrefix: "Serve", territoryExplanation: "quest’area è separata dal marcatore dell’ufficio del fornitore.", resourcesTitle: "Risorse pubblicate", viewResource: "Visualizza dettagli risorsa", descriptionLabel: "Descrizione", openIntake: "Apri informazioni di accesso", contactProvider: "Contatta il fornitore tramite RFxchange per informazioni di accesso aggiornate.", requestsTitle: "Richieste ai fornitori", requestRestricted: "Le richieste ai fornitori richiedono un’autorizzazione referral corrente.", requestUnavailable: "Impossibile caricare le richieste private. La scoperta pubblica resta disponibile.", noRequests: "Nessuna richiesta al fornitore.", selectRequest: "Seleziona una scheda richiesta per vedere la comunicazione privata.", managementUnavailable: "Impossibile caricare la gestione fornitori. Aggiorna prima di apportare modifiche.", communicationTitle: "Cronologia comunicazioni della richiesta", accept: "Accetta", decline: "Rifiuta", suggestProvider: "Suggerisci un altro fornitore pubblicato", chooseProvider: "Scegli fornitore", reason: "Motivo", redirect: "Reindirizza", privateMessage: "Messaggio privato della richiesta", addMessage: "Aggiungi messaggio", managementTitle: "Gestisci scoperta fornitori e risorse", publicationTitle: "Pubblicazione di scoperta", publicationNote: "Le modifiche private del profilo non vengono pubblicate automaticamente. Scegli i servizi correnti da rendere visibili.", withdrawBeforeEdit: "Ritira la scoperta prima di modificare", publishServices: "Pubblica servizi selezionati", createDraft: "Crea bozza risorsa", typeLabel: "Tipo", titleLabel: "Titolo", summaryLabel: "Riepilogo", intakeUrlLabel: "URL di accesso", visibilityLabel: "Visibilità", networkVisibility: "Rete RFxchange", publicVisibility: "Proiezione pubblica consentita", saveDraft: "Salva bozza", yourResources: "Le tue risorse", withdraw: "Ritira", publish: "Pubblica", inviteTitle: "Invita un fornitore a completare il profilo", recipientName: "Nome destinatario", emailLabel: "Email", contextLabel: "Contesto", issueInvitation: "Emetti invito" }),
});

const NOTICE_COPY = Object.freeze({
  "en-US": Object.freeze({ consentRequired: "Review and acknowledge the exact recipient and shared information before sending.", requestSentPrefix: "Request sent to", requestFailed: "Request failed.", resourceActionFailed: "Resource action failed.", providerActionFailed: "Provider request action failed.", yourOrganization: "Your organization", searchMatch: "Matches this search and locality", localityMatch: "Serves this locality", suggestedProviderLabel: "Suggested provider", messagesUnavailable: "Private messages could not be loaded. The request and public Resources discovery remain available." }),
  es: Object.freeze({ consentRequired: "Revisa y confirma el destinatario exacto y la información compartida antes de enviar.", requestSentPrefix: "Solicitud enviada a", requestFailed: "La solicitud falló.", resourceActionFailed: "La acción del recurso falló.", providerActionFailed: "La acción de la solicitud al proveedor falló.", yourOrganization: "Tu organización", searchMatch: "Coincide con esta búsqueda y localidad", localityMatch: "Presta servicio en esta localidad", suggestedProviderLabel: "Proveedor sugerido", messagesUnavailable: "No se pudieron cargar los mensajes privados. La solicitud y el descubrimiento público de Recursos siguen disponibles." }),
  fr: Object.freeze({ consentRequired: "Vérifiez et confirmez le destinataire exact et les informations partagées avant l’envoi.", requestSentPrefix: "Demande envoyée à", requestFailed: "Échec de la demande.", resourceActionFailed: "Échec de l’action sur la ressource.", providerActionFailed: "Échec de l’action sur la demande fournisseur.", yourOrganization: "Votre organisation", searchMatch: "Correspond à cette recherche et à cette localité", localityMatch: "Dessert cette localité", suggestedProviderLabel: "Fournisseur suggéré", messagesUnavailable: "Les messages privés n’ont pas pu être chargés. La demande et la découverte publique des Ressources restent disponibles." }),
  de: Object.freeze({ consentRequired: "Prüfen und bestätigen Sie vor dem Senden den genauen Empfänger und die freigegebenen Informationen.", requestSentPrefix: "Anfrage gesendet an", requestFailed: "Anfrage fehlgeschlagen.", resourceActionFailed: "Ressourcenaktion fehlgeschlagen.", providerActionFailed: "Anbieteranfrageaktion fehlgeschlagen.", yourOrganization: "Ihre Organisation", searchMatch: "Entspricht dieser Suche und Region", localityMatch: "Bedient diese Region", suggestedProviderLabel: "Vorgeschlagener Anbieter", messagesUnavailable: "Private Nachrichten konnten nicht geladen werden. Die Anfrage und die öffentliche Ressourcensuche bleiben verfügbar." }),
  it: Object.freeze({ consentRequired: "Controlla e conferma il destinatario esatto e le informazioni condivise prima dell’invio.", requestSentPrefix: "Richiesta inviata a", requestFailed: "Richiesta non riuscita.", resourceActionFailed: "Azione sulla risorsa non riuscita.", providerActionFailed: "Azione sulla richiesta al fornitore non riuscita.", yourOrganization: "La tua organizzazione", searchMatch: "Corrisponde a questa ricerca e località", localityMatch: "Serve questa località", suggestedProviderLabel: "Fornitore suggerito", messagesUnavailable: "Impossibile caricare i messaggi privati. La richiesta e la scoperta pubblica delle Risorse restano disponibili." }),
});

const RESOURCES_COPY = Object.freeze({
  "en-US": Object.freeze({ ...COPY["en-US"], ...NOTICE_COPY["en-US"] }),
  es: Object.freeze({ ...COPY.es, ...NOTICE_COPY.es }),
  fr: Object.freeze({ ...COPY.fr, ...NOTICE_COPY.fr }),
  de: Object.freeze({ ...COPY.de, ...NOTICE_COPY.de }),
  it: Object.freeze({ ...COPY.it, ...NOTICE_COPY.it }),
});

export function resourcesMobileCopy(locale: Locale) { return RESOURCES_COPY[locale]; }

const VALUE_LABELS: Readonly<Record<Locale, Readonly<Record<string, string>>>> = Object.freeze({
  "en-US": Object.freeze({ available: "Available", limited: "Limited", unknown: "Unknown", unavailable: "Unavailable", "in-person": "In person", virtual: "Virtual", hybrid: "Hybrid", service: "Service", program: "Program", workshop: "Workshop", "funding-program": "Funding program", resource: "Resource", announcement: "Announcement", draft: "Draft", published: "Published", withdrawn: "Withdrawn", expired: "Expired", sent: "Sent", accepted: "Accepted", declined: "Declined", redirected: "Redirected", contacted: "Contacted", closed: "Closed", "economic-development": "Economic development", "business-association": "Business association", "capital-provider": "Capital provider", "education-workforce": "Education and workforce", "government-assistance": "Government assistance", "technical-assistance": "Technical assistance", "incubator-accelerator-coworking": "Incubator, accelerator, or coworking", "professional-support": "Professional support", "procurement-contracting-assistance": "Procurement and contracting assistance", other: "Other" }),
  es: Object.freeze({ available: "Disponible", limited: "Limitado", unknown: "Desconocido", unavailable: "No disponible", "in-person": "Presencial", virtual: "Virtual", hybrid: "Híbrido", service: "Servicio", program: "Programa", workshop: "Taller", "funding-program": "Programa de financiación", resource: "Recurso", announcement: "Anuncio", draft: "Borrador", published: "Publicado", withdrawn: "Retirado", expired: "Vencido", sent: "Enviada", accepted: "Aceptada", declined: "Rechazada", redirected: "Redirigida", contacted: "Contactada", closed: "Cerrada", "economic-development": "Desarrollo económico", "business-association": "Asociación empresarial", "capital-provider": "Proveedor de capital", "education-workforce": "Educación y fuerza laboral", "government-assistance": "Asistencia gubernamental", "technical-assistance": "Asistencia técnica", "incubator-accelerator-coworking": "Incubadora, aceleradora o coworking", "professional-support": "Apoyo profesional", "procurement-contracting-assistance": "Asistencia en compras y contratación", other: "Otro" }),
  fr: Object.freeze({ available: "Disponible", limited: "Limitée", unknown: "Inconnue", unavailable: "Indisponible", "in-person": "En personne", virtual: "Virtuel", hybrid: "Hybride", service: "Service", program: "Programme", workshop: "Atelier", "funding-program": "Programme de financement", resource: "Ressource", announcement: "Annonce", draft: "Brouillon", published: "Publiée", withdrawn: "Retirée", expired: "Expirée", sent: "Envoyée", accepted: "Acceptée", declined: "Refusée", redirected: "Réorientée", contacted: "Contactée", closed: "Fermée", "economic-development": "Développement économique", "business-association": "Association d’entreprises", "capital-provider": "Fournisseur de capitaux", "education-workforce": "Éducation et main-d’œuvre", "government-assistance": "Aide publique", "technical-assistance": "Assistance technique", "incubator-accelerator-coworking": "Incubateur, accélérateur ou coworking", "professional-support": "Soutien professionnel", "procurement-contracting-assistance": "Aide aux achats et contrats", other: "Autre" }),
  de: Object.freeze({ available: "Verfügbar", limited: "Begrenzt", unknown: "Unbekannt", unavailable: "Nicht verfügbar", "in-person": "Vor Ort", virtual: "Virtuell", hybrid: "Hybrid", service: "Leistung", program: "Programm", workshop: "Workshop", "funding-program": "Förderprogramm", resource: "Ressource", announcement: "Ankündigung", draft: "Entwurf", published: "Veröffentlicht", withdrawn: "Zurückgezogen", expired: "Abgelaufen", sent: "Gesendet", accepted: "Angenommen", declined: "Abgelehnt", redirected: "Weitergeleitet", contacted: "Kontaktiert", closed: "Geschlossen", "economic-development": "Wirtschaftsförderung", "business-association": "Wirtschaftsverband", "capital-provider": "Kapitalanbieter", "education-workforce": "Bildung und Arbeitskräfte", "government-assistance": "Staatliche Unterstützung", "technical-assistance": "Technische Unterstützung", "incubator-accelerator-coworking": "Inkubator, Accelerator oder Coworking", "professional-support": "Professionelle Unterstützung", "procurement-contracting-assistance": "Beschaffungs- und Vertragsunterstützung", other: "Sonstige" }),
  it: Object.freeze({ available: "Disponibile", limited: "Limitata", unknown: "Sconosciuta", unavailable: "Non disponibile", "in-person": "In presenza", virtual: "Virtuale", hybrid: "Ibrida", service: "Servizio", program: "Programma", workshop: "Workshop", "funding-program": "Programma di finanziamento", resource: "Risorsa", announcement: "Annuncio", draft: "Bozza", published: "Pubblicata", withdrawn: "Ritirata", expired: "Scaduta", sent: "Inviata", accepted: "Accettata", declined: "Rifiutata", redirected: "Reindirizzata", contacted: "Contattata", closed: "Chiusa", "economic-development": "Sviluppo economico", "business-association": "Associazione imprenditoriale", "capital-provider": "Fornitore di capitale", "education-workforce": "Istruzione e forza lavoro", "government-assistance": "Assistenza pubblica", "technical-assistance": "Assistenza tecnica", "incubator-accelerator-coworking": "Incubatore, acceleratore o coworking", "professional-support": "Supporto professionale", "procurement-contracting-assistance": "Assistenza ad acquisti e contratti", other: "Altro" }),
});

export function resourcesMobileValueLabel(locale: Locale, value: string): string {
  return VALUE_LABELS[locale][value] ?? value;
}

function organizationKey(id: string) { return `organization:${id}`; }
function resourceKey(id: string) { return `provider-resource:${id}`; }
function requestKey(id: string) { return `provider-request:${id}`; }

function excerpt(value: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}

function resourcesHref(
  selection: Readonly<Record<string, string | null | undefined>>,
  context?: ResourcesMobileNavigationContext,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selection)) {
    if (value) params.set(key, value);
  }
  const selectionEntries = Object.entries(selection).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const longSelectionState = (() => {
    const query = params.toString();
    if (`/resources${query ? `?${query}` : ""}`.length <= 240 || selectionEntries.length !== 1) {
      return Object.freeze({ href: null, embeddedReturn: false });
    }
    const [kind, id] = selectionEntries[0]!;
    const compactKind = { provider: "p", resource: "r", request: "q" }[kind];
    if (!compactKind) return Object.freeze({ href: null, embeddedReturn: false });
    const fallback = `/resources/v/${compactKind}/${id}`;
    const rfxReference = context?.rfxReference;
    const returnTo = context?.returnTo;
    if (!rfxReference || !returnTo) return Object.freeze({ href: fallback, embeddedReturn: false });
    const returnPrefix = `/opportunities/${encodeURIComponent(rfxReference)}/assess`;
    if (!returnTo.startsWith(returnPrefix)) return Object.freeze({ href: fallback, embeddedReturn: false });
    const returnSuffix = returnTo.slice(returnPrefix.length);
    const contextualFallback = `${fallback}/${encodeURIComponent(rfxReference)}/${encodeURIComponent(returnSuffix || "-")}`;
    return contextualFallback.length <= 240
      ? Object.freeze({ href: contextualFallback, embeddedReturn: true })
      : Object.freeze({ href: fallback, embeddedReturn: false });
  })();
  const longSelection = longSelectionState.href;
  if (longSelection) params.delete(selectionEntries[0]![0]);
  const href = () => {
    const query = params.toString();
    return `${longSelection ?? "/resources"}${query ? `?${query}` : ""}`;
  };
  const addWhenBounded = (key: string, value: string | null | undefined) => {
    if (!value) return;
    params.set(key, value);
    if (href().length > 240) params.delete(key);
  };
  if (!longSelectionState.embeddedReturn && context?.rfxReference && context.returnTo) {
    params.set("rfxReference", context.rfxReference);
    params.set("returnTo", context.returnTo);
    if (href().length > 240) {
      params.delete("returnTo");
      params.delete("rfxReference");
    }
  } else if (!longSelectionState.embeddedReturn) {
    addWhenBounded("rfxReference", context?.rfxReference);
  }
  addWhenBounded("rfxGap", context?.rfxGap);
  if (context?.availability && context.availability !== "all") {
    addWhenBounded("availability", context.availability);
  }
  addWhenBounded("q", context?.query?.trim());
  return href();
}

function providerHref(id: string, context?: ResourcesMobileNavigationContext) {
  return resourcesHref({ provider: id }, context);
}
function resourceHref(resource: ProviderResourceProjection, context?: ResourcesMobileNavigationContext) {
  return resourcesHref({ resource: resource.id }, context);
}
function requestHref(id: string, context?: ResourcesMobileNavigationContext) {
  return resourcesHref({ request: id }, context);
}

function identityForProvider(provider: ProviderDiscoveryProjection) {
  const id = String(provider.organizationId);
  return createExchangeSubjectIdentity({ subjectKind: "organization", selectionKey: organizationKey(id), organizationId: id, recordType: null, recordId: null });
}

function identityForResource(resource: ProviderResourceProjection) {
  return createExchangeSubjectIdentity({ subjectKind: "record", selectionKey: resourceKey(resource.id), organizationId: String(resource.organizationId), recordType: "provider-resource", recordId: resource.id });
}

function identityForRequest(request: ProviderRequest) {
  return createExchangeSubjectIdentity({ subjectKind: "record", selectionKey: requestKey(request.id), organizationId: String(request.providerContext.providerOrganizationId), recordType: "provider-request", recordId: request.id });
}

function favorite() {
  return projectFavoriteState({ visible: false, favorited: null, operational: false, applicable: false, authorized: false, handler: null });
}

function providerCard(provider: ProviderDiscoveryProjection, authorization: ResourcesMobileAuthorization, locale: Locale, context?: ResourcesMobileNavigationContext) {
  const copy = resourcesMobileCopy(locale);
  const id = String(provider.organizationId);
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForProvider(provider),
    title: provider.displayName,
    organizationIdentity: provider.displayName,
    locality: provider.territory.name,
    summary: excerpt(provider.populationsServed),
    indicator: { label: copy.available, value: resourcesMobileValueLabel(locale, provider.availability), emphasis: provider.availability === "available" ? "positive" : "neutral" },
    classifications: provider.categories.map((value, index) => ({ id: `category-${index}`, label: copy.official, value: resourcesMobileValueLabel(locale, value) })),
    metadata: [
      { id: "services", label: copy.services, value: excerpt(provider.services.map((service) => service.name).join(" · ")) },
      { id: "eligibility", label: copy.eligibility, value: excerpt(provider.eligibility) },
    ],
    dates: { publishedAt: provider.publishedAt, updatedAt: provider.updatedAt },
    favorite: favorite(),
    recordActions: [
      projectRecordAction({ id: "resources.view-provider", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewProvider, operational: true, applicable: true, authorized: authorization.openPlatform, handler: { kind: "href", href: providerHref(id, context) } }),
      projectRecordAction({ id: "resources.request-support", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.requestSupport, operational: true, applicable: true, authorized: authorization.referralManage, handler: { kind: "href", href: providerHref(id, context) } }),
    ],
    canonicalHref: providerHref(id, context),
    returnLens: "resources",
  });
}

function resourceCard(resource: ProviderResourceProjection, provider: ProviderDiscoveryProjection | null, authorization: ResourcesMobileAuthorization, locale: Locale, context?: ResourcesMobileNavigationContext) {
  const copy = resourcesMobileCopy(locale);
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForResource(resource),
    title: resource.title,
    organizationIdentity: resource.providerDisplayName,
    locality: provider?.territory.name ?? null,
    summary: excerpt(resource.summary),
    indicator: { label: copy.available, value: resourcesMobileValueLabel(locale, resource.status), emphasis: "neutral" },
    metadata: [{ id: "eligibility", label: copy.eligibility, value: excerpt(resource.eligibility) }],
    dates: { publishedAt: resource.publishedAt, updatedAt: resource.updatedAt, closesAt: resource.endsAt },
    favorite: favorite(),
    recordActions: [projectRecordAction({ id: "resources.view-resource", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewResource, operational: true, applicable: true, authorized: authorization.openPlatform, handler: { kind: "href", href: resourceHref(resource, context) } })],
    canonicalHref: resourceHref(resource, context),
    returnLens: "resources",
  });
}

function requestCard(request: ProviderRequest, authorization: ResourcesMobileAuthorization, locale: Locale, context?: ResourcesMobileNavigationContext) {
  const copy = resourcesMobileCopy(locale);
  const title = request.role === "sender" ? request.recipientLabel : request.senderOrganizationName;
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForRequest(request),
    title,
    organizationIdentity: title,
    summary: excerpt(request.summary),
    indicator: { label: copy.request, value: resourcesMobileValueLabel(locale, request.status), emphasis: ["declined", "expired"].includes(request.status) ? "attention" : "neutral" },
    dates: { updatedAt: request.updatedAt },
    favorite: favorite(),
    recordActions: [projectRecordAction({ id: "resources.view-request", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewRequest, operational: true, applicable: true, authorized: authorization.referralManage, handler: { kind: "href", href: requestHref(request.id, context) } })],
    canonicalHref: requestHref(request.id, context),
    returnLens: "resources",
  });
}

function isProviderRequest(request: RequestProjection): request is ProviderRequest {
  return request.purpose === "provider-connection" && request.providerContext !== null;
}

function selectionFor(input: ResourcesMobileProjectionInput, providers: readonly ProviderDiscoveryProjection[], resources: readonly ProviderResourceProjection[], requests: readonly ProviderRequest[]): ExchangeSelectionState {
  const source = input.selection?.source ?? "restored";
  const resource = resources.find((candidate) => candidate.id === input.selection?.resourceId);
  if (resource) {
    const organizationId = String(resource.organizationId);
    const provider = providers.find((candidate) => String(candidate.organizationId) === organizationId);
    return createExchangeSelectionState({ kind: "record", source, selectedRecord: { selectionKey: resourceKey(resource.id), recordType: "provider-resource", recordId: resource.id, organizationId }, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "provider" }, selectedMarker: provider?.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "associated-organization" } : null });
  }
  const request = requests.find((candidate) => candidate.id === input.selection?.requestId);
  if (request) {
    const organizationId = String(request.providerContext.providerOrganizationId);
    const provider = providers.find((candidate) => String(candidate.organizationId) === organizationId);
    return createExchangeSelectionState({ kind: "record", source, selectedRecord: { selectionKey: requestKey(request.id), recordType: "provider-request", recordId: request.id, organizationId }, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "provider" }, selectedMarker: provider?.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "associated-organization" } : null });
  }
  const provider = providers.find((candidate) => String(candidate.organizationId) === input.selection?.providerOrganizationId);
  if (!provider) return createExchangeSelectionState({ kind: "none" });
  const organizationId = String(provider.organizationId);
  return createExchangeSelectionState({ kind: "organization", source, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "subject" }, selectedMarker: provider.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "focal" } : null });
}

function actionProjection(
  definition: ReturnType<typeof exchangeRoomActionDefinitionsForLens>[number],
  input: ResourcesMobileProjectionInput,
  selection: ExchangeSelectionState,
): ExchangeRoomActionProjection {
  const selectedOrganizationId = selection.selectedOrganization?.organizationId ?? input.viewerOrganizationId;
  const own = selectedOrganizationId === input.viewerOrganizationId;
  const variant = own ? "own" as const : "external" as const;
  const selectedResource = selection.selectedRecord?.recordType === "provider-resource";
  const operational = definition.id === "resources.offer-request" || definition.id === "resources.manage-view";
  const applicable = definition.id === "resources.offer-request"
    ? (own || selection.selectedOrganization !== null)
    : definition.id === "resources.manage-view"
      ? (!own && selectedResource)
      : true;
  const authorized = input.authorization.openPlatform
    && (definition.id === "resources.offer-request"
      ? (own ? input.authorization.resourceManage : input.authorization.referralManage)
      : true);
  const href = definition.id === "resources.offer-request"
    ? own
      ? resourcesHref({ manage: "offer" }, input.navigationContext)
      : providerHref(selectedOrganizationId, input.navigationContext)
    : definition.id === "resources.manage-view" && selectedResource
      ? resourcesHref({ resource: selection.selectedRecord!.recordId }, input.navigationContext)
      : null;
  const handlerCandidate: ExchangeRoomActionProjection["handlerCandidate"] = operational && applicable && href
    ? Object.freeze({ kind: "href" as const, href })
    : null;
  const reason: ExchangeRoomActionDisabledReason | null = !operational
    ? "not-operational"
    : !applicable
      ? "not-applicable"
      : !authorized
        ? "not-authorized"
        : handlerCandidate
          ? null
          : "not-operational";
  return Object.freeze({
    ...definition,
    labelKey: variant === "own" ? definition.labelKey : definition.externalLabelKey,
    variant,
    operational,
    applicable,
    authorized,
    authorization: variant === "own" ? definition.authorization : definition.externalAuthorization,
    availability: reason === null ? "active" : "disabled",
    disabledReason: reason,
    handlerCandidate,
    resolvedHandler: reason === null ? handlerCandidate : null,
  });
}

export interface ResourcesMobileProjectionInput {
  readonly viewerOrganizationId: string;
  readonly geography: Readonly<{ id: string; label: string | null }>;
  readonly providers: readonly ProviderDiscoveryProjection[];
  readonly resources: readonly ProviderResourceProjection[];
  readonly requests: readonly RequestProjection[];
  readonly authorization: ResourcesMobileAuthorization;
  readonly locale: Locale;
  readonly search: string;
  readonly availability: string;
  readonly navigationContext?: ResourcesMobileNavigationContext;
  readonly selection?: ResourcesMobileSelectionInput;
  readonly camera?: ParticipantMapCamera | null;
}

export function buildResourcesMobileProjection(input: ResourcesMobileProjectionInput): ResourcesMobileProjection {
  const terms = resourceDiscoveryTerms(input.search);
  const eligibleResources = input.authorization.openPlatform
    ? input.resources.filter((resource) => resource.status === "published")
    : [];
  const resources = Object.freeze(eligibleResources.filter((resource) => {
    const provider = input.providers.find((candidate) => candidate.organizationId === resource.organizationId);
    return matchesResourceDiscoveryTerms([
      resource.title,
      resource.summary,
      resource.description,
      resource.eligibility,
      resource.providerDisplayName,
      provider?.populationsServed,
      provider?.eligibility,
      provider?.intakeMethod,
      ...(provider?.categories ?? []),
      ...(provider?.services.flatMap((service) => [service.name, service.description]) ?? []),
    ], terms);
  }));
  const providers = Object.freeze(input.authorization.openPlatform ? input.providers.filter((provider) => {
    if (provider.territory.releaseState !== "released") return false;
    if (input.availability !== "all" && provider.availability !== input.availability) return false;
    const providerMatches = matchesResourceDiscoveryTerms([
      provider.displayName,
      provider.populationsServed,
      provider.eligibility,
      provider.intakeMethod,
      ...provider.categories,
      ...provider.services.flatMap((service) => [service.name, service.description]),
    ], terms);
    return providerMatches || resources.some((resource) => resource.organizationId === provider.organizationId);
  }) : []);
  const filteredResources = Object.freeze(resources.filter((resource) => providers.some((provider) => provider.organizationId === resource.organizationId)));
  const requests = Object.freeze(input.authorization.referralManage && input.availability === "all"
    ? input.requests.filter(isProviderRequest).filter((request) => matchesResourceDiscoveryTerms([
        request.recipientLabel,
        request.role === "recipient" ? request.senderOrganizationName : null,
        request.summary,
        request.status,
      ], terms))
    : []);
  const selection = selectionFor(input, providers, filteredResources, requests);
  const providerCards = Object.freeze(providers.map((provider) => providerCard(provider, input.authorization, input.locale, input.navigationContext)));
  const resourceCards = Object.freeze(filteredResources.map((resource) => resourceCard(resource, providers.find((provider) => provider.organizationId === resource.organizationId) ?? null, input.authorization, input.locale, input.navigationContext)));
  const requestCards = Object.freeze(requests.map((request) => requestCard(request, input.authorization, input.locale, input.navigationContext)));
  const cards = Object.freeze([...providerCards, ...resourceCards, ...requestCards]);
  const territoryProviders = new Map<string, ProviderDiscoveryProjection[]>();
  for (const provider of providers) {
    const key = `${provider.territory.geographyId}:${JSON.stringify(provider.territory.geometry)}`;
    territoryProviders.set(key, [...(territoryProviders.get(key) ?? []), provider]);
  }
  const serviceTerritories = Object.freeze([...territoryProviders.values()].map((territoryGroup): ResourcesMobileServiceTerritoryBinding => {
    const provider = territoryGroup[0]!;
    const geometryReference = `resource-territory:${provider.territory.geographyId}`;
    const area = createExchangeMapAreaProjection({ areaId: geometryReference, associationSelectionKey: null, geographyId: provider.territory.geographyId, geometryReference, privacy: "locality-only", release: "released", accessibleLabel: provider.territory.name, selectable: false, selected: false, emphasized: false, layerIds: [RESOURCES_MOBILE_LAYER_IDS.serviceTerritories] });
    return Object.freeze({ providerOrganizationId: String(provider.organizationId), area, geometryReference, geometry: provider.territory.geometry });
  }));
  const providerObjects = providers.flatMap((provider) => provider.marker ? [createExchangeMapObjectProjection({ identity: identityForProvider(provider), markerId: provider.marker.id, coordinate: { longitude: provider.marker.coordinate[0], latitude: provider.marker.coordinate[1] }, privacy: provider.marker.privacyTreatment, accessibleLabel: provider.marker.accessibleLocationLabel, selectable: true, layerIds: [RESOURCES_MOBILE_LAYER_IDS.providers] })] : []);
  const spatialResults: ExchangeResultSpatialDisposition[] = [
    ...providers.map((provider) => provider.marker ? ({ kind: "mapped" as const, identity: identityForProvider(provider), markerId: provider.marker.id }) : ({ kind: "list-only" as const, identity: identityForProvider(provider), reason: "missing-authoritative-coordinate" as const, explanationKey: "mobileExchange.results.listOnly.missingCoordinate" })),
    ...filteredResources.map((resource) => ({ kind: "list-only" as const, identity: identityForResource(resource), reason: "non-point-record" as const, explanationKey: "mobileExchange.results.listOnly.nonPointRecord" })),
    ...requests.map((request) => ({ kind: "list-only" as const, identity: identityForRequest(request), reason: "non-point-record" as const, explanationKey: "mobileExchange.results.listOnly.nonPointRecord" })),
  ];
  const resultSetId = `resources:${input.geography.id}:${input.search}:${input.availability}`.slice(0, 240);
  const results = createLensResultSetState({ status: cards.length ? "ready" : "empty", lens: "resources", resultSetId, cards: cards.length ? cards : undefined, messageKey: cards.length ? null : "resourceNetworkWorkspace.empty" });
  const map = createLensMapProjection({ lens: "resources", geography: createExchangeGeographyContext({ geographyId: input.geography.id, label: input.geography.label, serverRevalidated: true }), objects: cards.length ? [...providerObjects, ...serviceTerritories.map((binding) => binding.area)] : [], activeLayerIds: [RESOURCES_MOBILE_LAYER_IDS.providers, RESOURCES_MOBILE_LAYER_IDS.serviceTerritories], layerStateAuthority: "domain-revalidated", camera: input.camera ?? null });
  const discovery = createLensDiscoveryProjection({ lens: "resources", queryId: resultSetId, map, results, spatialResults: cards.length ? spatialResults : [] });
  const actionRail = mobileLensActionRail("resources", exchangeRoomActionDefinitionsForLens("resources").map((definition) => actionProjection(definition, input, selection)));
  return Object.freeze({ discovery, selection, actionRail, serviceTerritories, providerCards, resourceCards, requestCards });
}
