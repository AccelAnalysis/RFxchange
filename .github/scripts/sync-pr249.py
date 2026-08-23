from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/geography-fabric-foundation"
HEAD_BRANCH = "control/geography-fabric-resolver-enrichment"


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(
        list(args),
        cwd=ROOT,
        check=True,
        capture_output=capture,
        text=True,
    )
    return result.stdout if capture else ""


run("git", "fetch", "origin", BASE_BRANCH)
run("git", "merge", "--no-edit", f"origin/{BASE_BRANCH}")

canonical_ci = run(
    "git",
    "show",
    f"origin/{BASE_BRANCH}:.github/workflows/ci.yml",
    capture=True,
)
(ROOT / ".github/workflows/ci.yml").write_text(canonical_ci)

for temporary in [
    ".github/scripts/sync-pr249.py",
]:
    candidate = ROOT / temporary
    if candidate.exists():
        candidate.unlink()

run("git", "diff", "--check")
run("git", "add", "-A")
if subprocess.run(
    ["git", "diff", "--cached", "--quiet"],
    cwd=ROOT,
    check=False,
).returncode != 0:
    run("git", "commit", "-m", "Sync resolver enrichment with hardened Geography Fabric")
run("git", "push", "origin", f"HEAD:{HEAD_BRANCH}")
