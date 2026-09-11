// Reuse the existing session exchange, CSRF, secure host-only cookie and identity boundary.
// Administrative authorization is independently enforced by every protected page and handler.
export { GET, POST, DELETE } from "@/app/api/auth/session/route";
export const runtime = "nodejs";
