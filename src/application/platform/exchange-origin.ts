/** Only deployment configuration chooses the Exchange origin; URL/user input never does. */
export function exchangeOrigin(configured: string | undefined): string {
  if (!configured?.trim()) return "";
  const url = new URL(configured.trim());
  const local = process.env.NODE_ENV !== "production"
    && url.protocol === "http:"
    && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((!local && url.protocol !== "https:") || url.username || url.password
    || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Exchange origin must be an HTTPS origin without credentials, path or query.");
  }
  return url.origin;
}
