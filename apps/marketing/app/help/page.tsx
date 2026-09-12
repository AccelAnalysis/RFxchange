import { MarketingHeader, MarketingFooter } from "@/apps/marketing/components/MarketingChrome";
import { PublicHelp } from "@/apps/marketing/components/PublicHelp";
import { loadPublishedPublicHelp } from "@/src/infrastructure/communications/public-help-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { PUBLIC_HELP_ARTICLES } from "@/src/application/support/public-help";
export const dynamic = "force-dynamic";
import { getMarketingDictionary } from "@/apps/marketing/dictionary";
export async function generateMetadata() {
  const { dictionary } = await getMarketingDictionary();
  const copy = dictionary.interface.services.help;
  return { title: copy.nav, description: copy.intro };
}
export default async function Page() {
  let articles = PUBLIC_HELP_ARTICLES;
  try { articles = await loadPublishedPublicHelp(getServerFirestore()); }
  catch { console.warn("public-help-published-copy-unavailable"); }
  return <><MarketingHeader/><main><PublicHelp articles={articles}/></main><MarketingFooter/></>;
}
