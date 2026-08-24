import type { Locale } from "../../i18n/config";

export interface RfxMobileTaskCopy {
  readonly ariaLabel: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly newRfx: string;
  readonly createUnavailable: string;
  readonly resume: string;
  readonly noDrafts: string;
  readonly quick: string;
  readonly guided: string;
  readonly formal: string;
  readonly quickHelp: string;
  readonly guidedHelp: string;
  readonly formalHelp: string;
  readonly intentLabel: string;
  readonly intentPlaceholder: string;
  readonly dictate: string;
  readonly dictating: string;
  readonly dictationUnavailable: string;
  readonly camera: string;
  readonly file: string;
  readonly attachmentsUnavailable: string;
  readonly apply: string;
  readonly applyFirst: string;
  readonly applied: string;
  readonly need: string;
  readonly build: string;
  readonly define: string;
  readonly review: string;
}

const catalogs: Readonly<Record<Locale, RfxMobileTaskCopy>> = Object.freeze({
  "en-US": Object.freeze({
    ariaLabel: "Mobile RFx task controls",
    eyebrow: "Create from anywhere",
    title: "What do you need?",
    subtitle: "Start simply. Add structure only when it helps.",
    newRfx: "New RFx",
    createUnavailable: "Your current organization role cannot create or edit RFx drafts.",
    resume: "Resume",
    noDrafts: "No saved drafts yet",
    quick: "Quick",
    guided: "Guided",
    formal: "Formal",
    quickHelp: "Capture the need, outcome, scope, timing, and location first.",
    guidedHelp: "Work through the package and requirements with more prompts.",
    formalHelp: "Use the full response design, evaluation, and publication workflow.",
    intentLabel: "Describe the need in your own words",
    intentPlaceholder: "Example: We need a firm to help redesign our customer intake process…",
    dictate: "Dictate",
    dictating: "Listening…",
    dictationUnavailable: "Dictation is not available in this browser.",
    camera: "Camera",
    file: "File",
    attachmentsUnavailable: "Camera and file attachments will become available when RFx attachments are available.",
    apply: "Use this in the RFx",
    applyFirst: "Create or resume a draft first.",
    applied: "Added to the RFx need. Save the RFx when ready.",
    need: "Need",
    build: "Build",
    define: "Define",
    review: "Review",
  }),
  es: Object.freeze({
    ariaLabel: "Controles móviles de RFx",
    eyebrow: "Cree desde cualquier lugar",
    title: "¿Qué necesita?",
    subtitle: "Empiece de forma sencilla. Añada estructura solo cuando ayude.",
    newRfx: "Nuevo RFx",
    createUnavailable: "Su función actual en la organización no permite crear ni editar borradores RFx.",
    resume: "Continuar",
    noDrafts: "Aún no hay borradores guardados",
    quick: "Rápido",
    guided: "Guiado",
    formal: "Formal",
    quickHelp: "Capture primero la necesidad, el resultado, el alcance, el plazo y la ubicación.",
    guidedHelp: "Recorra el paquete y los requisitos con más orientación.",
    formalHelp: "Use el diseño completo de respuesta, evaluación y publicación.",
    intentLabel: "Describa la necesidad con sus propias palabras",
    intentPlaceholder: "Ejemplo: Necesitamos una firma que ayude a rediseñar nuestro proceso de admisión…",
    dictate: "Dictar",
    dictating: "Escuchando…",
    dictationUnavailable: "El dictado no está disponible en este navegador.",
    camera: "Cámara",
    file: "Archivo",
    attachmentsUnavailable: "La cámara y los archivos estarán disponibles cuando los adjuntos de RFx estén disponibles.",
    apply: "Usar esto en el RFx",
    applyFirst: "Cree o continúe un borrador primero.",
    applied: "Añadido a la necesidad del RFx. Guarde el RFx cuando esté listo.",
    need: "Necesidad",
    build: "Construir",
    define: "Definir",
    review: "Revisar",
  }),
  fr: Object.freeze({
    ariaLabel: "Commandes RFx mobiles",
    eyebrow: "Créez où que vous soyez",
    title: "De quoi avez-vous besoin ?",
    subtitle: "Commencez simplement. Ajoutez de la structure seulement quand elle est utile.",
    newRfx: "Nouveau RFx",
    createUnavailable: "Votre rôle actuel dans l’organisation ne permet pas de créer ou modifier des brouillons RFx.",
    resume: "Reprendre",
    noDrafts: "Aucun brouillon enregistré",
    quick: "Rapide",
    guided: "Guidé",
    formal: "Formel",
    quickHelp: "Saisissez d’abord le besoin, le résultat, la portée, le calendrier et le lieu.",
    guidedHelp: "Parcourez le dossier et les exigences avec davantage de repères.",
    formalHelp: "Utilisez le parcours complet de réponse, d’évaluation et de publication.",
    intentLabel: "Décrivez le besoin avec vos propres mots",
    intentPlaceholder: "Exemple : Nous avons besoin d’un cabinet pour repenser notre processus d’accueil…",
    dictate: "Dicter",
    dictating: "Écoute…",
    dictationUnavailable: "La dictée n’est pas disponible dans ce navigateur.",
    camera: "Caméra",
    file: "Fichier",
    attachmentsUnavailable: "La caméra et les fichiers seront disponibles lorsque les pièces jointes RFx seront disponibles.",
    apply: "Utiliser dans le RFx",
    applyFirst: "Créez ou reprenez d’abord un brouillon.",
    applied: "Ajouté au besoin RFx. Enregistrez le RFx lorsque vous êtes prêt.",
    need: "Besoin",
    build: "Construire",
    define: "Définir",
    review: "Réviser",
  }),
  it: Object.freeze({
    ariaLabel: "Controlli RFx mobili",
    eyebrow: "Crea ovunque",
    title: "Di cosa hai bisogno?",
    subtitle: "Inizia in modo semplice. Aggiungi struttura solo quando serve.",
    newRfx: "Nuovo RFx",
    createUnavailable: "Il tuo ruolo attuale nell’organizzazione non consente di creare o modificare bozze RFx.",
    resume: "Riprendi",
    noDrafts: "Nessuna bozza salvata",
    quick: "Rapido",
    guided: "Guidato",
    formal: "Formale",
    quickHelp: "Acquisisci prima bisogno, risultato, ambito, tempi e luogo.",
    guidedHelp: "Procedi attraverso pacchetto e requisiti con più indicazioni.",
    formalHelp: "Usa l’intero flusso di risposta, valutazione e pubblicazione.",
    intentLabel: "Descrivi il bisogno con parole tue",
    intentPlaceholder: "Esempio: Ci serve un’azienda che ci aiuti a riprogettare il processo di acquisizione clienti…",
    dictate: "Detta",
    dictating: "In ascolto…",
    dictationUnavailable: "La dettatura non è disponibile in questo browser.",
    camera: "Fotocamera",
    file: "File",
    attachmentsUnavailable: "Fotocamera e file saranno disponibili quando gli allegati RFx saranno disponibili.",
    apply: "Usa questo nel RFx",
    applyFirst: "Crea o riprendi prima una bozza.",
    applied: "Aggiunto al bisogno RFx. Salva il RFx quando sei pronto.",
    need: "Bisogno",
    build: "Costruisci",
    define: "Definisci",
    review: "Rivedi",
  }),
  de: Object.freeze({
    ariaLabel: "Mobile RFx-Steuerung",
    eyebrow: "Von überall erstellen",
    title: "Was benötigen Sie?",
    subtitle: "Beginnen Sie einfach. Fügen Sie Struktur nur hinzu, wenn sie hilft.",
    newRfx: "Neues RFx",
    createUnavailable: "Ihre aktuelle Organisationsrolle erlaubt das Erstellen oder Bearbeiten von RFx-Entwürfen nicht.",
    resume: "Fortsetzen",
    noDrafts: "Noch keine gespeicherten Entwürfe",
    quick: "Schnell",
    guided: "Geführt",
    formal: "Formal",
    quickHelp: "Erfassen Sie zuerst Bedarf, Ergebnis, Umfang, Zeitplan und Ort.",
    guidedHelp: "Bearbeiten Sie Paket und Anforderungen mit zusätzlichen Hinweisen.",
    formalHelp: "Nutzen Sie den vollständigen Ablauf für Antwort, Bewertung und Veröffentlichung.",
    intentLabel: "Beschreiben Sie den Bedarf in eigenen Worten",
    intentPlaceholder: "Beispiel: Wir benötigen ein Unternehmen, das unseren Kundenaufnahmeprozess neu gestaltet…",
    dictate: "Diktieren",
    dictating: "Hört zu…",
    dictationUnavailable: "Diktieren ist in diesem Browser nicht verfügbar.",
    camera: "Kamera",
    file: "Datei",
    attachmentsUnavailable: "Kamera- und Dateianhänge werden verfügbar, sobald RFx-Anhänge verfügbar sind.",
    apply: "Im RFx verwenden",
    applyFirst: "Erstellen oder öffnen Sie zuerst einen Entwurf.",
    applied: "Zum RFx-Bedarf hinzugefügt. Speichern Sie das RFx, wenn Sie bereit sind.",
    need: "Bedarf",
    build: "Aufbauen",
    define: "Definieren",
    review: "Prüfen",
  }),
});

export function rfxMobileTaskCopy(locale: Locale): RfxMobileTaskCopy {
  return catalogs[locale];
}
