from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/hampton-roads-provider-promotion-review"
HEAD_BRANCH = "control/public-media-intro-rfx-attachments"
model = ROOT / "src/domain/storage/model.ts"
text = model.read_text()

replacements = [
    (
        '  "organization-media",\n  "organization-document",',
        '  "organization-media",\n  "organization-intro-video",\n  "organization-document",',
    ),
    (
        '''    "organization-media": Object.freeze({
      category: "organization-media" as const,
      sensitivity: "standard" as const,
      maximumBytes: 15 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-document": Object.freeze({''',
        '''    "organization-media": Object.freeze({
      category: "organization-media" as const,
      sensitivity: "standard" as const,
      maximumBytes: 15 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-intro-video": Object.freeze({
      category: "organization-intro-video" as const,
      sensitivity: "standard" as const,
      maximumBytes: 25 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["video/mp4", "video/webm"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-document": Object.freeze({''',
    ),
    (
        '    "image/webp": "webp",\n    "application/pdf": "pdf",',
        '    "image/webp": "webp",\n    "video/mp4": "mp4",\n    "video/webm": "webm",\n    "application/pdf": "pdf",',
    ),
]
for old, new in replacements:
    if text.count(old) != 1:
        raise RuntimeError(f"Expected exactly one storage-model insertion point: {old[:80]!r}")
    text = text.replace(old, new)
model.write_text(text)

subprocess.run(["git", "fetch", "origin", BASE_BRANCH], cwd=ROOT, check=True)
canonical_ci = subprocess.run(
    ["git", "show", f"origin/{BASE_BRANCH}:.github/workflows/ci.yml"],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
).stdout
(ROOT / ".github/workflows/ci.yml").write_text(canonical_ci)
script = ROOT / ".github/scripts/add-intro-video-storage-policy.py"
if script.exists():
    script.unlink()

subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.name", "RFxchange implementation"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.email", "actions@users.noreply.github.com"], cwd=ROOT, check=True)
subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
subprocess.run(
    ["git", "commit", "-m", "Add governed Organization intro-video storage policy"],
    cwd=ROOT,
    check=True,
)
subprocess.run(
    ["git", "push", "origin", f"HEAD:{HEAD_BRANCH}"],
    cwd=ROOT,
    check=True,
)
