from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FIREWALL = ROOT / "src/i18n/participant-language-firewall.ts"


def insert_before(text: str, anchor: str, lines: str) -> str:
    if lines in text:
        return text
    if anchor not in text:
        raise RuntimeError(f"participant-language firewall anchor not found: {anchor}")
    return text.replace(anchor, f"{lines}\n{anchor}")


text = FIREWALL.read_text()

# JavaScript \b is ASCII-oriented; remove trailing boundaries after accented words.
text = text.replace(
    '    [/\\bcontexte autorisé\\b/gi, "contexte disponible"],',
    '    [/\\bcontexte autorisé/gi, "contexte disponible"],',
)
text = text.replace(
    '    [/\\bgouverné(?:e|es|s)?\\b/gi, ""],',
    '    [/\\bgouverné(?:e|es|s)?/gi, ""],',
)

text = insert_before(
    text,
    '    [/\\bgobernad[ao]s?\\b/gi, ""],',
    '''    [/\\bestado del estado\\b/gi, "estado"],
    [/\\bLos funciones\\b/gi, "Las funciones"],''',
)
text = insert_before(
    text,
    '    [/\\bgouverné(?:e|es|s)?/gi, ""],',
    '''    [/\\bstatut de statut\\b/gi, "statut"],
    [/Les fonctionnalités futures restent clairement identifiés/gi, "Les fonctionnalités futures restent clairement identifiées"],''',
)
text = insert_before(
    text,
    '    [/\\bgovernat[oaie]\\b/gi, ""],',
    '''    [/\\bstato del stato\\b/gi, "stato"],
    [/\\bI funzionalità\\b/gi, "Le funzionalità"],''',
)
text = insert_before(
    text,
    '    [/\\bgeregelte[nmrs]?\\b/gi, ""],',
    '''    [/\\bkünftige Funktionen\\b/gi, "Künftige Funktionen"],
    [/\\bautorisiertem Kontext\\b/gi, "verfügbarem Kontext"],''',
)

FIREWALL.write_text(text)
subprocess.run([
    "node", "--experimental-transform-types",
    "scripts/rewrite-participant-language-sources.mjs", "--write",
], cwd=ROOT, check=True)
