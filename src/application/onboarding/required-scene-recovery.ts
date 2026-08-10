export const REQUIRED_SCENE_MAX_ATTEMPTS = 3;
export const REQUIRED_SCENE_RETRY_BASE_DELAY_MS = 180;

type RetryWait = (milliseconds: number, signal: AbortSignal) => Promise<void>;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function waitForRequiredSceneRetry(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("The required scene request was cancelled.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function loadRequiredSceneWithRetry<T>(
  request: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  wait: RetryWait = waitForRequiredSceneRetry,
): Promise<T> {
  let finalError: unknown = new Error("The required scene is unavailable.");
  for (let attempt = 1; attempt <= REQUIRED_SCENE_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await request(signal);
    } catch (error) {
      if (isAbortError(error)) throw error;
      finalError = error;
      if (attempt < REQUIRED_SCENE_MAX_ATTEMPTS) {
        await wait(REQUIRED_SCENE_RETRY_BASE_DELAY_MS * attempt, signal);
      }
    }
  }
  throw finalError;
}
