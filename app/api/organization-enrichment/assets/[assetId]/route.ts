import { NextRequest, NextResponse } from "next/server";

import { OrganizationEnrichmentError } from "@/src/application/organization-enrichment/organization-enrichment";
import { createServerOrganizationEnrichmentService } from "@/src/infrastructure/organization-enrichment/runtime";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await context.params;
    const result = await createServerOrganizationEnrichmentService().readPublishedAsset(assetId);
    return new NextResponse(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        "content-type": result.contentType,
        "content-length": String(result.bytes.byteLength),
        "cache-control": "public, max-age=300, must-revalidate",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    const status = error instanceof OrganizationEnrichmentError && error.code === "not-found" ? 404 : 409;
    return NextResponse.json({ error: status === 404 ? "Published organization asset was not found." : "Published asset is unavailable." }, { status });
  }
}
