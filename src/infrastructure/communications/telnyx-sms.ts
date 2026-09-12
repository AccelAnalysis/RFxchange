import { createPublicKey, verify } from "node:crypto";

export class SmsProviderError extends Error {
  readonly code: string;
  readonly outcome: "known-failure" | "unknown";
  readonly retryable: boolean;
  constructor(code: string, outcome: "known-failure" | "unknown", retryable: boolean) { super(code); this.code = code; this.outcome = outcome; this.retryable = retryable; }
}
export function verifyTelnyxWebhook(body: Buffer, timestamp: string | null, signature: string | null, publicKey: string, now = Date.now()): boolean {
  if (!timestamp || !/^\d{10}$/.test(timestamp) || !signature || Math.abs(now / 1000 - Number(timestamp)) > 300 || body.byteLength > 64_000) return false;
  try {
    const rawKey = Buffer.from(publicKey, "base64");
    const sig = Buffer.from(signature, "base64");
    if (rawKey.byteLength !== 32 || sig.byteLength !== 64) return false;
    const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), rawKey]), format: "der", type: "spki" });
    return verify(null, Buffer.concat([Buffer.from(`${timestamp}|`), body]), key, sig);
  } catch { return false; }
}
export class TelnyxSmsProvider {
  private readonly configuration: { apiKey: string; from: string; messagingProfileId: string };
  private readonly fetcher: typeof fetch;
  constructor(configuration: { apiKey: string; from: string; messagingProfileId: string }, fetcher: typeof fetch = fetch) { this.configuration = configuration; this.fetcher = fetcher; }
  async send(to: string, text: string): Promise<{ providerKey: "telnyx"; externalReference: string }> {
    const { apiKey, from, messagingProfileId } = this.configuration;
    if (!apiKey || !/^[+]\d{8,15}$/.test(from) || !messagingProfileId || !/^[+]\d{8,15}$/.test(to) || !text.trim() || text.length > 900) throw new SmsProviderError("sms-configuration-invalid", "known-failure", false);
    let response: Response;
    try {
      response = await this.fetcher("https://api.telnyx.com/v2/messages", { method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000),
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to, text, messaging_profile_id: messagingProfileId, type: "SMS" }),
      });
    } catch { throw new SmsProviderError("sms-delivery-outcome-unknown", "unknown", false); }
    // A timeout/server error may occur after acceptance. Never blindly retry an ambiguous send.
    if (response.status >= 500 || response.status === 408) throw new SmsProviderError("sms-delivery-outcome-unknown", "unknown", false);
    if (!response.ok) throw new SmsProviderError(`sms-http-${response.status}`, "known-failure", response.status === 429);
    try {
      const payload = await response.json() as { data?: { id?: unknown } };
      if (typeof payload.data?.id !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(payload.data.id)) throw new Error("invalid");
      return { providerKey: "telnyx", externalReference: payload.data.id };
    } catch { throw new SmsProviderError("sms-receipt-unknown", "unknown", false); }
  }
}
