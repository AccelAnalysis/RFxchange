import { redirect } from "next/navigation";
import { applicationOrigins } from "@/src/application/platform/application-origins";
import { administrativeReturnPath } from "@/src/application/admin/return-path";
import { SignInClient } from "@/src/components/auth/SignInClient";

interface SignInPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function safeReturnTo(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  const normalized = candidate.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return null;
  if (normalized.startsWith("/signin")) return null;
  return normalized;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : {};
  const returnTo = safeReturnTo(params.returnTo);
  if (returnTo === "/admin" || returnTo?.startsWith("/admin/")) {
    const destination = new URL("/signin", applicationOrigins.admin);
    destination.searchParams.set("returnTo", administrativeReturnPath(returnTo));
    redirect(destination.href);
  }
  return <SignInClient returnTo={returnTo} />;
}
