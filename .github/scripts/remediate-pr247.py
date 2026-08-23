from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]


def file_text(path: str) -> str:
    return (ROOT / path).read_text()


def write_text(path: str, content: str) -> None:
    (ROOT / path).write_text(content)


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    text = file_text(path)
    count = text.count(old)
    if count != expected:
        raise RuntimeError(
            f"{path}: expected {expected} occurrence(s), found {count}: {old[:100]!r}"
        )
    write_text(path, text.replace(old, new))


# Preserve approximate-location truth when a marker is also selected.
beacons = "src/components/map/exchange-beacon-images.ts"
replace_exact(
    beacons,
    'export const EXCHANGE_BEACON_STATES = ["default", "approximate", "selected"] as const;',
    'export const EXCHANGE_BEACON_STATES = ["default", "approximate", "selected", "selected-approximate"] as const;',
)
replace_exact(
    beacons,
    '  const selected = state === "selected";',
    '  const selected = state === "selected" || state === "selected-approximate";',
)
replace_exact(
    beacons,
    '  const colors = palette(kind, state);\n  context.clearRect(0, 0, WIDTH, HEIGHT);',
    '  const colors = palette(kind, state);\n  const selected = state === "selected" || state === "selected-approximate";\n  context.clearRect(0, 0, WIDTH, HEIGHT);',
)
replace_exact(
    beacons,
    '  context.fillStyle = state === "selected" ? "rgba(214,162,58,0.28)" : "rgba(4,5,7,0.28)";',
    '  context.fillStyle = selected ? "rgba(214,162,58,0.28)" : "rgba(4,5,7,0.28)";',
)
replace_exact(
    beacons,
    '  context.ellipse(CENTER_X + 4, TIP_Y + 3, state === "selected" ? 34 : 27, 8, 0, 0, Math.PI * 2);',
    '  context.ellipse(CENTER_X + 4, TIP_Y + 3, selected ? 34 : 27, 8, 0, 0, Math.PI * 2);',
)
replace_exact(
    beacons,
    '  context.lineWidth = state === "selected" ? 10 : 8;',
    '  context.lineWidth = selected ? 10 : 8;',
)
replace_exact(
    beacons,
    '  context.lineWidth = state === "selected" ? 6 : 4;',
    '  context.lineWidth = selected ? 6 : 4;',
)
replace_exact(
    beacons,
    '  if (state === "approximate") context.setLineDash([7, 5]);',
    '  if (state === "approximate" || state === "selected-approximate") context.setLineDash([7, 5]);',
)
replace_exact(
    beacons,
    '  if (state === "selected") {',
    '  if (selected) {',
)

adapter = "src/application/participant/lens-map-projection-adapter.ts"
replace_exact(
    adapter,
    '''  const state = selected
    ? "selected"
    : projection.privacy === "approximate"
      ? "approximate"
      : "default";''',
    '''  const approximate = projection.privacy === "approximate";
  const state = selected
    ? approximate
      ? "selected-approximate"
      : "selected"
    : approximate
      ? "approximate"
      : "default";''',
)

scene = "src/components/map/ExchangeSpatialScene.tsx"
replace_exact(
    scene,
    'type MapBasemapPresetId = "exchange" | "street" | "night";',
    'type MapBasemapPresetId = "exchange" | "street";',
)
replace_exact(
    scene,
    '  lightPreset: "day" | "night";',
    '  lightPreset: "day";',
)
replace_exact(
    scene,
    '  Object.freeze({ id: "night", label: "Night", lightPreset: "night", theme: "default", showTransitLabels: false, showPointOfInterestLabels: true }),\n',
    '',
)
replace_exact(
    scene,
    '''          marker.id === focusedMarkerId
            ? "selected"
            : marker.precision === "approximate"
              ? "approximate"
              : "default",''',
    '''          marker.id === focusedMarkerId
            ? marker.precision === "approximate"
              ? "selected-approximate"
              : "selected"
            : marker.precision === "approximate"
              ? "approximate"
              : "default",''',
    expected=2,
)

# Preserve the current Opportunity discovery state through assessment/team entry.
actions = "src/application/participant/exchange-room-actions.ts"
replace_exact(
    actions,
    '  readonly currentOpportunityReference?: string | null;\n}',
    '  readonly currentOpportunityReference?: string | null;\n  readonly currentOpportunityReturnTo?: string | null;\n}',
)
replace_exact(
    actions,
    '''function resolveHandler(
  rule: HandlerRule,
  input: ExchangeRoomActionProjectionInput,
): ExchangeRoomActionHandler | null {''',
    '''function safeOpportunityReturnTo(
  input: ExchangeRoomActionProjectionInput,
): string | null {
  const candidate = input.currentOpportunityReturnTo?.trim();
  if (!candidate || candidate.startsWith("//") || /[\\r\\n]/.test(candidate)) return null;
  return /^\\/opportunities(?:[/?#]|$)/.test(candidate) ? candidate : null;
}

function resolveHandler(
  rule: HandlerRule,
  input: ExchangeRoomActionProjectionInput,
): ExchangeRoomActionHandler | null {''',
)
replace_exact(
    actions,
    '''    case "opportunity-assessment": {
      const reference = input.currentOpportunityReference?.trim();
      return reference
        ? Object.freeze({ kind: "href", href: `/opportunities/${encodeURIComponent(reference)}/assess` })
        : null;
    }''',
    '''    case "opportunity-assessment": {
      const reference = input.currentOpportunityReference?.trim();
      if (!reference) return null;
      const assessmentHref = `/opportunities/${encodeURIComponent(reference)}/assess`;
      const returnTo = safeOpportunityReturnTo(input);
      return Object.freeze({
        kind: "href",
        href: returnTo
          ? `${assessmentHref}?returnTo=${encodeURIComponent(returnTo)}`
          : assessmentHref,
      });
    }''',
)

workspace = "src/components/rfx/OpportunityDiscoveryWorkspace.tsx"
replace_exact(
    workspace,
    '    currentOpportunityReference: selected?.reference ?? null,\n  }), [selected?.reference, spatialScope.organizationId]);',
    '    currentOpportunityReference: selected?.reference ?? null,\n    currentOpportunityReturnTo: queryHref(result, selected?.reference ?? null),\n  }), [result, selected?.reference, spatialScope.organizationId]);',
)

# Focused regressions.
convergence_test = "test/final-convergence-beacons-actions.test.mjs"
replace_exact(
    convergence_test,
    '  for (const state of ["default", "approximate", "selected"]) assert.match(renderer, new RegExp(`"${state}"`));',
    '  for (const state of ["default", "approximate", "selected", "selected-approximate"]) assert.match(renderer, new RegExp(`"${state}"`));',
)
replace_exact(
    convergence_test,
    '  assert.match(scene, /setConfigProperty\\("basemap", "lightPreset"/);\n  assert.match(adapter, /privacy: projection\\.privacy/);',
    '  assert.match(scene, /setConfigProperty\\("basemap", "lightPreset"/);\n  assert.doesNotMatch(scene, /id: "night"|label: "Night"|lightPreset: "night"/);\n  assert.match(scene, /selected-approximate/);\n  assert.match(adapter, /privacy: projection\\.privacy/);\n  assert.match(adapter, /selected-approximate/);',
)
replace_exact(
    convergence_test,
    '  assert.match(opportunity, /currentOpportunityReference: selected\\?\\.reference \\?\\? null/);',
    '  assert.match(opportunity, /currentOpportunityReference: selected\\?\\.reference \\?\\? null/);\n  assert.match(opportunity, /currentOpportunityReturnTo: queryHref\\(result, selected\\?\\.reference \\?\\? null\\)/);\n  assert.match(registry, /safeOpportunityReturnTo/);',
)

permissions_test = "test/exchange-room-phase2-permissions.test.mjs"
replace_exact(
    permissions_test,
    '    currentOpportunityReference: "RFX 001",\n  }));',
    '    currentOpportunityReference: "RFX 001",\n    currentOpportunityReturnTo: "/opportunities?sort=deadline&selected=RFX%20001",\n  }));',
)
replace_exact(
    permissions_test,
    '    href: "/opportunities/RFX%20001/assess",',
    '    href: "/opportunities/RFX%20001/assess?returnTo=%2Fopportunities%3Fsort%3Ddeadline%26selected%3DRFX%2520001",',
    expected=2,
)
write_text(
    permissions_test,
    file_text(permissions_test)
    + '''\n\ntest("Opportunity assessment preserves only a safe internal discovery return target", () => {
  const safe = projectExchangeRoomActions(input("opportunities-rfx", {
    selectedOrganizationId: "organization-other",
    currentOpportunityReference: "RFX 001",
    currentOpportunityReturnTo: "/opportunities?view=watched",
  }));
  assert.equal(
    safe[1].resolvedHandler?.kind === "href" ? safe[1].resolvedHandler.href : null,
    "/opportunities/RFX%20001/assess?returnTo=%2Fopportunities%3Fview%3Dwatched",
  );

  const unsafe = projectExchangeRoomActions(input("opportunities-rfx", {
    selectedOrganizationId: "organization-other",
    currentOpportunityReference: "RFX 001",
    currentOpportunityReturnTo: "https://example.test/opportunities",
  }));
  assert.equal(
    unsafe[1].resolvedHandler?.kind === "href" ? unsafe[1].resolvedHandler.href : null,
    "/opportunities/RFX%20001/assess",
  );
});\n''',
)

# Remove all temporary remediation machinery and restore canonical CI before commit.
subprocess.run(["git", "fetch", "origin", "main"], cwd=ROOT, check=True)
ci = subprocess.run(
    ["git", "show", "origin/main:.github/workflows/ci.yml"],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
).stdout
write_text(".github/workflows/ci.yml", ci)
for temporary in [
    ".github/workflows/one-time-pr247-remediation.yml",
    ".github/pr247-remediation-trigger",
    ".github/scripts/remediate-pr247.py",
]:
    candidate = ROOT / temporary
    if candidate.exists():
        candidate.unlink()

subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.name", "RFxchange implementation"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.email", "actions@users.noreply.github.com"], cwd=ROOT, check=True)
subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
subprocess.run(
    ["git", "commit", "-m", "Fix beacon privacy, basemap authority, and discovery return"],
    cwd=ROOT,
    check=True,
)
subprocess.run(
    ["git", "push", "origin", "HEAD:control/final-convergence-beacons-actions"],
    cwd=ROOT,
    check=True,
)
