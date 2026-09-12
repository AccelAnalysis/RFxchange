export interface PublicCampaign { id: string; version: number; status: "draft" | "published" | "archived"; title: string; summary: string; actionLabel: string; updatedAt: string; }
export function validateCampaign(value: unknown): Omit<PublicCampaign, "version" | "updatedAt"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid-campaign");
  const c = value as Record<string, unknown>;
  if (typeof c.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,79}$/.test(c.id) || !["draft", "published", "archived"].includes(String(c.status))) throw new Error("invalid-campaign");
  for (const [key, max] of [["title", 140], ["summary", 1500], ["actionLabel", 60]] as const) if (typeof c[key] !== "string" || !c[key].trim() || c[key].length > max) throw new Error("invalid-copy");
  return { id: c.id, status: c.status as PublicCampaign["status"], title: String(c.title).trim(), summary: String(c.summary).trim(), actionLabel: String(c.actionLabel).trim() };
}
