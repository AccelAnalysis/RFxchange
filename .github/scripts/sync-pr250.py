from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/geography-fabric-resolver-enrichment"
HEAD_BRANCH = "control/hampton-roads-provider-approval"


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

script = ROOT / ".github/scripts/sync-pr250.py"
if script.exists():
    script.unlink()

run("git", "diff", "--check")
run("git", "add", "-A")
if subprocess.run(
    ["git", "diff", "--cached", "--quiet"],
    cwd=ROOT,
    check=False,
).returncode != 0:
    run("git", "commit", "-m", "Sync provider approval with enriched Geography Fabric")
run("git", "push", "origin", f"HEAD:{HEAD_BRANCH}")
