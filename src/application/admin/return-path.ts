/** Navigation state is never an authorization grant. Only local Admin destinations are accepted. */
export function administrativeReturnPath(value: string | string[] | undefined): string {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!candidate || /[\\\u0000-\u001f]/.test(candidate)) return "/admin";
  try {
    const base = "https://admin.invalid";
    const url = new URL(candidate, base);
    if (url.origin !== base || !candidate.startsWith("/")) return "/admin";
    if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}
