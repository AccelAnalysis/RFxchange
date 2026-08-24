from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FIREWALL = ROOT / "src/i18n/participant-language-firewall.ts"
MESSAGES = ROOT / "src/i18n/messages"
BASE = "046863c4ba133ca259cd1c173ec29c299fb6d734"

PRESERVE = [
    "es.json", "fr.json", "it.json", "de.json",
    "network-education/es.json", "network-education/fr.json",
    "network-education/it.json", "network-education/de.json",
]

ADDITIONS = {
    '    [/\\bgobernad[ao]s?\\b/gi, ""],': '''    [/^La\\s+Las organizaciones/gi, "Las organizaciones"],
    [/\\bLa\\s+Wave\\s+3\\s+está\\s+completa\\.?\\s*/gi, ""],
    [/\\bWave\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bSlice\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bparticipantes permitidos\\b/gi, "organizaciones participantes"],
    [/\\borganizaciones permitidas\\b/gi, "organizaciones participantes"],
    [/\\bcontexto autorizado\\b/gi, "contexto disponible"],
    [/\\bautorizad[ao] por el servidor\\b/gi, "disponible"],
    [/\\bgeografía autorizada por el servidor\\b/gi, "geografía seleccionada"],
    [/\\bgeografía controlada\\b/gi, "geografía seleccionada"],
    [/\\blocalidad controlada\\b/gi, "localidad seleccionada"],
    [/\\bRed controlada\\b/gi, "Exchange"],
    [/\\bciclo de vida\\b/gi, "estado"],
    [/\\bproyección(?:es)?\\b/gi, "vista"],
    [/\\bprocedencia\\b/gi, "información de origen"],
    [/\\bcanónic[oa]s?\\b/gi, "actual"],
    [/\\bno autoritativ[oa]s?\\b/gi, "sugerido"],
    [/\\bautoritativ[oa]s?\\b/gi, "confirmado"],
    [/\\bautoridad geográfica\\b/gi, "configuración geográfica"],
    [/\\bautoridad de emisor\\b/gi, "permiso para emitir"],
    [/\\bautoridad del evaluador\\b/gi, "permiso para evaluar"],
    [/\\bautoridad actual\\b/gi, "permisos actuales"],
    [/\\bflujos publicados\\b/gi, "flujos disponibles"],
    [/\\bregulad[ao]s?\\b/gi, ""],
    [/\\bgobernad[ao]s?\\b/gi, ""],''',
    '    [/\\bgouverné(?:e|es|s)?\\b/gi, ""],': '''    [/^La\\s+est achevée\\.\\s*/gi, ""],
    [/\\bLa\\s+Wave\\s+3\\s+est\\s+terminée\\.?\\s*/gi, ""],
    [/\\bWave\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bSlice\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bparticipants autorisés\\b/gi, "participants"],
    [/\\borganisations autorisées\\b/gi, "organisations participantes"],
    [/\\bcontexte autorisé\\b/gi, "contexte disponible"],
    [/\\bgéographie autorisée par le serveur\\b/gi, "géographie sélectionnée"],
    [/\\bgéographie contrôlée\\b/gi, "géographie sélectionnée"],
    [/\\blocalité contrôlée\\b/gi, "localité sélectionnée"],
    [/\\bRéseau contrôlé\\b/gi, "Exchange"],
    [/\\bcycle de vie\\b/gi, "statut"],
    [/\\bprojection(?:s)?\\b/gi, "vue"],
    [/\\bprovenance\\b/gi, "informations sur la source"],
    [/\\bcanonique(?:s)?\\b/gi, "actuel"],
    [/\\bautorité géographique\\b/gi, "configuration géographique"],
    [/\\bautorité d’émetteur\\b/gi, "permission d’émettre"],
    [/\\bautorité d’évaluation\\b/gi, "permission d’évaluer"],
    [/\\bautorité actuelle\\b/gi, "autorisations actuelles"],
    [/\\bflux publiés\\b/gi, "flux disponibles"],
    [/\\bgouverné(?:e|es|s)?\\b/gi, ""],''',
    '    [/\\bgovernat[oaie]\\b/gi, ""],': '''    [/\\bLa\\s+Wave\\s+3\\s+è\\s+completa\\.?\\s*/gi, ""],
    [/\\bWave\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bSlice\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bpartecipanti autorizzati\\b/gi, "partecipanti"],
    [/\\borganizzazioni autorizzate\\b/gi, "organizzazioni partecipanti"],
    [/\\bcontesto autorizzato\\b/gi, "contesto disponibile"],
    [/\\bgeografia autorizzata dal server\\b/gi, "geografia selezionata"],
    [/\\bgeografia controllata\\b/gi, "geografia selezionata"],
    [/\\blocalità controllata\\b/gi, "località selezionata"],
    [/\\bRete controllata\\b/gi, "Exchange"],
    [/\\bciclo di vita\\b/gi, "stato"],
    [/\\bproiezione(?:i)?\\b/gi, "vista"],
    [/\\bprovenienza\\b/gi, "informazioni sulla fonte"],
    [/\\bcanonic[oaie]\\b/gi, "attuale"],
    [/\\bnon autoritativ[oaie]\\b/gi, "suggerito"],
    [/\\bautoritativ[oaie]\\b/gi, "confermato"],
    [/\\bstato autorevole\\b/gi, "informazioni confermate"],
    [/\\bautorità geografica\\b/gi, "configurazione geografica"],
    [/\\bautorità di emittente\\b/gi, "permesso di pubblicare"],
    [/\\bautorità di valutazione\\b/gi, "permesso di valutare"],
    [/\\bautorità attuale\\b/gi, "permessi attuali"],
    [/\\bflussi rilasciati\\b/gi, "flussi disponibili"],
    [/\\bgovernat[oaie]\\b/gi, ""],''',
    '    [/\\bgeregelte[nmrs]?\\b/gi, ""],': '''    [/\\bWave\\s+3\\s+ist\\s+abgeschlossen\\.?\\s*/gi, ""],
    [/\\bWave\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bSlice\\s+\\d+(?:\\.\\d+)?\\b/gi, ""],
    [/\\bzulässige Teilnehmer\\b/gi, "teilnehmende Organisationen"],
    [/\\bzulässige Organisationen\\b/gi, "teilnehmende Organisationen"],
    [/\\bautorisierter Kontext\\b/gi, "verfügbarer Kontext"],
    [/\\bserverseitig autorisierte Geografie\\b/gi, "ausgewählte Geografie"],
    [/\\bkontrollierte Geografie\\b/gi, "ausgewählte Geografie"],
    [/\\bkontrollierter Ort\\b/gi, "ausgewählter Ort"],
    [/\\bkontrolliertes Netzwerk\\b/gi, "Exchange"],
    [/\\bLebenszyklusstatus\\b/gi, "Status"],
    [/\\bLebenszyklus\\b/gi, "Status"],
    [/\\bProjektion(?:en)?\\b/gi, "Ansicht"],
    [/\\bHerkunft\\b/gi, "Quellenangaben"],
    [/\\bkanonisch(?:e|en|er|es)?\\b/gi, "aktuell"],
    [/\\bnicht autoritativ\\b/gi, "vorgeschlagen"],
    [/\\bAutorität\\b/gi, "Berechtigung"],
    [/\\bgeregelte[nmrs]?\\b/gi, ""],''',
}


def patch_firewall():
    text = FIREWALL.read_text()
    text = text.replace(r'[/\bOnda\s+3\s+è\s+completa\.?/gi, ""]', r'[/\bOnda(?:ta)?\s+3\s+è\s+completa\.?/gi, ""]')
    text = text.replace(r'[/\bOnda\s+\d+(?:\.\d+)?\b/gi, ""]', r'[/\bOnda(?:ta)?\s+\d+(?:\.\d+)?\b/gi, ""]')
    for anchor, replacement in ADDITIONS.items():
        if replacement in text:
            continue
        if anchor not in text:
            raise RuntimeError(f"locale rewrite anchor not found: {anchor}")
        text = text.replace(anchor, replacement)
    FIREWALL.write_text(text)


def regenerate_messages():
    preserved = {relative: (MESSAGES / relative).read_bytes() for relative in PRESERVE}
    subprocess.run(["git", "checkout", BASE, "--", "src/i18n/messages"], cwd=ROOT, check=True)
    for relative, content in preserved.items():
        path = MESSAGES / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    subprocess.run([
        "node", "--experimental-transform-types",
        "scripts/rewrite-participant-language-sources.mjs", "--write",
    ], cwd=ROOT, check=True)


patch_firewall()
regenerate_messages()
