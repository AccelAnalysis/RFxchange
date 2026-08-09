import type { ContentSafeInterpretationObserver } from "../../application/ai-interpretation/ports.ts";

export class JsonContentSafeInterpretationObserver implements ContentSafeInterpretationObserver {
  record(event: Parameters<ContentSafeInterpretationObserver["record"]>[0]): void {
    console.info(JSON.stringify({ event: "ai_amacs_interpretation", ...event }));
  }
}
