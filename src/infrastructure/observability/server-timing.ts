export interface ServerTimingEntry {
  readonly name: string;
  readonly durationMs: number;
  readonly description?: string;
}

function roundedDuration(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 10) / 10;
}

function timingName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return normalized || "operation";
}

function headerDescription(value: string): string {
  return value.replace(/["\\]/g, "").slice(0, 80);
}

function logTiming(entry: ServerTimingEntry): void {
  console.info(JSON.stringify({
    type: "rfx.server-timing",
    name: entry.name,
    durationMs: entry.durationMs,
    ...(entry.description ? { description: entry.description } : {}),
  }));
}

/**
 * Records an internal server span in structured logs. Use this for work that happens below a route
 * boundary (Firestore hydration, geocoding, map projection, etc.) where a response header cannot be
 * mutated directly.
 */
export async function measureServerOperation<T>(
  name: string,
  operation: () => Promise<T>,
  description?: string,
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    logTiming(Object.freeze({
      name: timingName(name),
      durationMs: roundedDuration(startedAt),
      ...(description ? { description } : {}),
    }));
  }
}

/**
 * Per-request Server-Timing collector. Timings are returned to browser devtools and are also logged
 * as structured events so production latency can be diagnosed without guessing from loading UI.
 */
export class ServerTimingCollector {
  private readonly entries: ServerTimingEntry[] = [];

  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    description?: string,
  ): Promise<T> {
    const startedAt = performance.now();
    try {
      return await operation();
    } finally {
      const entry = Object.freeze({
        name: timingName(name),
        durationMs: roundedDuration(startedAt),
        ...(description ? { description } : {}),
      });
      this.entries.push(entry);
      logTiming(entry);
    }
  }

  apply<T extends Response>(response: T): T {
    if (!this.entries.length) return response;
    response.headers.set(
      "Server-Timing",
      this.entries
        .map((entry) => {
          const description = entry.description
            ? `;desc="${headerDescription(entry.description)}"`
            : "";
          return `${entry.name};dur=${entry.durationMs}${description}`;
        })
        .join(", "),
    );
    return response;
  }
}
