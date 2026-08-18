import { redirect } from "next/navigation";

import {
  parseResourcesMobileWorkspaceQuery,
  parseResourceWorkspaceId,
} from "@/src/application/resource-network/resource-network-workspace";

interface Props {
  readonly params: Promise<Readonly<{ kind: string; id: string }>>;
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function ResourceSelectionRedirect({ params, searchParams }: Props) {
  const [{ kind, id }, rawSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const selectionId = parseResourceWorkspaceId(id);
  if (!selectionId || !["provider", "resource", "request"].includes(kind)) {
    redirect("/resources");
  }
  const context = parseResourcesMobileWorkspaceQuery(rawSearchParams);
  const query = new URLSearchParams();
  query.set(kind, selectionId);
  if (context.query) query.set("q", context.query);
  if (context.availability !== "all") query.set("availability", context.availability);
  if (context.rfxReference) query.set("rfxReference", context.rfxReference);
  if (context.rfxGap) query.set("rfxGap", context.rfxGap);
  if (context.returnTo) query.set("returnTo", context.returnTo);
  redirect(`/resources?${query.toString()}`);
}
