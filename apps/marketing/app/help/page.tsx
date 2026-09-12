import { MarketingHeader, MarketingFooter } from "@/apps/marketing/components/MarketingChrome";
import { PublicHelp } from "@/apps/marketing/components/PublicHelp";
import { loadPublishedPublicHelp } from "@/src/infrastructure/communications/public-help-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { PUBLIC_HELP_ARTICLES } from "@/src/application/support/public-help";
export const dynamic = "force-dynamic";
export const metadata = { title: "Help | RFxchange", description: "Answers about joining RFxchange and using the Exchange." };
export default async function Page() {
  let articles = PUBLIC_HELP_ARTICLES;
  try { articles = await loadPublishedPublicHelp(getServerFirestore()); }
  catch { console.warn("public-help-published-copy-unavailable"); }
  return <><MarketingHeader/><main><PublicHelp articles={articles}/></main><MarketingFooter/></>;
}
