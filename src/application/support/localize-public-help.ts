import { PUBLIC_HELP_ARTICLES, type PublicHelpArticle } from "./public-help.ts";

type HelpTranslation = Readonly<{ title: string; answer: string; keywords: string }>;

/** Translate the bundled guide only. An operator's published edits remain authoritative. */
export function localizePublicHelpArticles(
  articles: readonly PublicHelpArticle[],
  translations: Readonly<Record<string, HelpTranslation>>,
): readonly PublicHelpArticle[] {
  return articles.map((article) => {
    const bundled = PUBLIC_HELP_ARTICLES.find((item) => item.id === article.id);
    const translated = translations[article.id];
    if (!bundled || !translated || article.title !== bundled.title ||
      article.answer !== bundled.answer || article.path !== bundled.path ||
      JSON.stringify(article.keywords) !== JSON.stringify(bundled.keywords)) return article;
    return { ...article, title: translated.title, answer: translated.answer,
      keywords: [...new Set([...article.keywords, ...translated.keywords.split(/\s+/)])] };
  });
}
