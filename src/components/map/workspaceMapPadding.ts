/** Presentation padding only; it never changes an organization's geographic coordinates. */
export function workspaceMapPadding(
  overlay: "left" | "right" | null,
  viewport: Readonly<{ width: number; height: number }>,
  adaptiveWorkspace = false,
) {
  if (!overlay) return { top: 84, right: 36, bottom: 36, left: 36 };
  if (viewport.width <= (adaptiveWorkspace ? 1024 : 760)) {
    const sheetSpace = Math.min(viewport.height * 0.54, 540) + (viewport.width <= 760 ? 74 : 0) + 12;
    const bottom = adaptiveWorkspace
      ? Math.min(sheetSpace, Math.max(0, viewport.height - 152))
      : Math.min(viewport.height * 0.58, 520);
    return { top: 72, right: 22, bottom, left: 22 };
  }
  const panelSpace = adaptiveWorkspace
    ? Math.min(480, Math.max(420, viewport.width * 0.32)) + 16
    : Math.min(viewport.width * 0.48, 620);
  return overlay === "left"
    ? { top: 88, right: 72, bottom: 62, left: panelSpace }
    : { top: 88, right: panelSpace, bottom: 62, left: 72 };
}
