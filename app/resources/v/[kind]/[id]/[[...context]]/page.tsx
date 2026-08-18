import { redirect } from "next/navigation";

import { renderResourcesPage } from "@/app/resources/page";
import {
  parseResourceWorkspaceId,
  resourcesCompactReturnContext,
} from "@/src/application/resource-network/resource-network-workspace";

interface Props {
  readonly params: Promise<Readonly<{
    kind: string;
    id: string;
    context?: readonly string[];
  }>>;
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

const SELECTION_KIND = Object.freeze({
  p: "provider",
  r: "resource",
  q: "request",
} as const);

export default async function ResourceSelectionRoute({ params, searchParams }: Props) {
  const [{ kind, id, context = [] }, rawSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const selectionId = parseResourceWorkspaceId(id);
  const selectionKind = SELECTION_KIND[kind as keyof typeof SELECTION_KIND];
  if (!selectionId || !selectionKind || ![0, 2].includes(context.length)) redirect("/resources");

  const compactContext = resourcesCompactReturnContext(context[0], context[1]);
  return renderResourcesPage({
    searchParams: Promise.resolve({
      ...rawSearchParams,
      ...compactContext,
    }),
    selectionOverride: Object.freeze({ kind: selectionKind, id: selectionId }),
  });
}
