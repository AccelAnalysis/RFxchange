from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/hampton-roads-provider-approval"
HEAD_BRANCH = "control/hampton-roads-provider-firebase-promotion"

model = ROOT / "src/domain/admin-authorization/model.ts"
text = model.read_text()
old = '["provider.application.review", "provider", "Review resource-provider applications."],\n'
new = old + '["provider.seed.promote", "provider", "Promote an explicitly approved source-backed provider seed into canonical non-published Firebase records."],\n'
if text.count(old) != 1:
    raise RuntimeError("Expected one provider.application.review catalog entry.")
model.write_text(text.replace(old, new))

subprocess.run(["git", "fetch", "origin", BASE_BRANCH], cwd=ROOT, check=True)
canonical_ci = subprocess.run(
    ["git", "show", f"origin/{BASE_BRANCH}:.github/workflows/ci.yml"],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
).stdout
(ROOT / ".github/workflows/ci.yml").write_text(canonical_ci)

script = ROOT / ".github/scripts/patch-provider-seed-permission.py"
if script.exists():
    script.unlink()

subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
subprocess.run(
    ["git", "commit", "-m", "Add governed provider seed promotion authority"],
    cwd=ROOT,
    check=True,
)
subprocess.run(
    ["git", "push", "origin", f"HEAD:{HEAD_BRANCH}"],
    cwd=ROOT,
    check=True,
)
