export type OptionalWorkspacePanelResult<T> =
  | Readonly<{ available: true; value: T }>
  | Readonly<{ available: false }>;

export function settleOptionalWorkspacePanel<T>(
  label: string,
  pending: Promise<T>,
  report: (label: string, error: unknown) => void = (failedLabel, error) => {
    console.error(`[workspace-panel:${failedLabel}] optional dependency unavailable`, error);
  },
): Promise<OptionalWorkspacePanelResult<T>> {
  return pending.then(
    (value) => Object.freeze({ available: true as const, value }),
    (error) => {
      report(label, error);
      return Object.freeze({ available: false as const });
    },
  );
}
