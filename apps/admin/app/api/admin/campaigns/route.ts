import { NextRequest, NextResponse } from "next/server";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { saveCampaign } from "@/src/infrastructure/acquisition/campaigns";
export const runtime = "nodejs";
const access = (r: NextRequest, write: boolean) => resolveAdminRoute({ sessionCookie: r.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, permission: write ? "config.value.manage" : "config.value.read", scope: "GLOBAL", access: write ? "write" : "read" });
export async function GET(request: NextRequest) {
  if ((await access(request, false)).kind !== "authorized") return NextResponse.json({ error: "Campaign access required." }, { status: 403 });
  const db = getServerFirestore();
  const [campaigns, contexts] = await Promise.all([db.collection("marketingCampaigns").orderBy("updatedAt", "desc").limit(100).get(), db.collection("acquisitionContexts").orderBy("issuedAt", "desc").limit(500).get()]);
  return NextResponse.json({ campaigns: campaigns.docs.map(d => ({ ...d.data(), counts: {
    issued: contexts.docs.filter(c => c.get("source.channel") === "direct" && c.get("source.sourceReference") === d.id).length,
    bound: contexts.docs.filter(c => c.get("source.channel") === "direct" && c.get("source.sourceReference") === d.id && c.get("boundAt")).length,
    resumed: contexts.docs.filter(c => c.get("source.channel") === "direct" && c.get("source.sourceReference") === d.id && c.get("firstResumedAt")).length,
  } })), sampleLimit: 500, sampledAt: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const authorized = await access(request, true);
  if (authorized.kind !== "authorized") return NextResponse.json({ error: "Campaign management access required." }, { status: 403 });
  let input;
  try { input = JSON.parse((await boundedRequestBytes(request, 8192)).toString("utf8")); }
  catch { return NextResponse.json({ error: "Review the campaign." }, { status: 400 }); }
  try { return NextResponse.json({ campaign: await saveCampaign(getServerFirestore(), authorized.authority, input) }); }
  catch { return NextResponse.json({ error: "Review the fields and refresh the campaign version before retrying." }, { status: 409 }); }
}
