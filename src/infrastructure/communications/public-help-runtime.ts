import type { Firestore } from "firebase-admin/firestore";
import { PUBLIC_HELP_ARTICLES, validatePublicHelpArticles } from "../../application/support/public-help.ts";

/** Only explicitly published, schema-validated public copy crosses into Marketing. */
export async function loadPublishedPublicHelp(db: Firestore) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const snapshot = await Promise.race([
    db.collection("publicHelpConfiguration").doc("current").get(),
    new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("public-help-timeout")), 2000); }),
  ]).finally(() => clearTimeout(timeout));
  if (!snapshot.exists) return PUBLIC_HELP_ARTICLES;
  return validatePublicHelpArticles(snapshot.get("articles"));
}
