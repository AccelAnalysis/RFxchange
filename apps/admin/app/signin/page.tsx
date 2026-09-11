import { SignInClient } from "@/src/components/auth/SignInClient";
import { administrativeReturnPath } from "@/src/application/admin/return-path";

export default async function SignInPage({ searchParams }: Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const params = searchParams ? await searchParams : {};
  return <SignInClient audience="admin" returnTo={administrativeReturnPath(params.returnTo)} />;
}
