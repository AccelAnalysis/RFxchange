from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/hampton-roads-provider-approval"
HEAD_BRANCH = "control/hampton-roads-provider-firebase-promotion"

service = ROOT / "src/application/provider-seeding/provider-promotion-service.ts"
text = service.read_text()
old = "    || sourceRecord.id !== candidate.id\n"
new = "    || String(sourceRecord.id) !== String(candidate.id)\n"
if text.count(old) != 1:
    raise RuntimeError("Expected exactly one branded provider source/candidate identity comparison.")
service.write_text(text.replace(old, new))

subprocess.run(["git", "fetch", "origin", BASE_BRANCH], cwd=ROOT, check=True)
canonical_ci = subprocess.run(
    ["git", "show", f"origin/{BASE_BRANCH}:.github/workflows/ci.yml"],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
).stdout
(ROOT / ".github/workflows/ci.yml").write_text(canonical_ci)

script = ROOT / ".github/scripts/fix-provider-promotion-typecheck.py"
if script.exists():
    script.unlink()

subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.name", "RFxchange implementation"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.email", "actions@users.noreply.github.com"], cwd=ROOT, check=True)
subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
subprocess.run(
    ["git", "commit", "-m", "Fix branded provider promotion identity comparison"],
    cwd=ROOT,
    check=True,
)
subprocess.run(
    ["git", "push", "origin", f"HEAD:{HEAD_BRANCH}"],
    cwd=ROOT,
    check=True,
)
