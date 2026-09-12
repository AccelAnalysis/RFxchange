export interface PublicHelpArticle { id: string; title: string; answer: string; path: string; keywords: string[]; }
export const PUBLIC_HELP_ARTICLES: readonly PublicHelpArticle[] = [
  { id: "join", title: "How do I join?", answer: "Start with Join Free. Create your account, find your organization, and follow the setup steps. If your organization is already listed, select it so you can establish access without creating a duplicate.", path: "/join", keywords: ["join", "register", "signup", "start", "account"] },
  { id: "organization", title: "My organization is already listed", answer: "Search for your organization during setup. Selecting a listing starts the access process; it does not automatically verify your organization. If someone already manages it, request access or ask them for an invitation.", path: "/join", keywords: ["organization", "claim", "listed", "duplicate", "invitation"] },
  { id: "capabilities", title: "What are capabilities?", answer: "Capabilities describe what your organization can provide. Choose the entries that fit your business and confirm any suggestions before they become part of your profile.", path: "/how-it-works", keywords: ["capability", "capabilities", "amacs", "profile", "services"] },
  { id: "opportunities", title: "How do I find opportunities?", answer: "After setup, use the RFx lens to explore available opportunities. Search and filter results, inspect the details, and use the actions available for that opportunity.", path: "/how-it-works", keywords: ["rfx", "opportunity", "opportunities", "search", "respond"] },
  { id: "pricing", title: "Where can I review membership options?", answer: "Review the membership page for the current offer and availability. Membership does not establish organization verification or guarantee a business outcome.", path: "/membership", keywords: ["price", "pricing", "cost", "membership", "billing", "subscription"] },
  { id: "privacy", title: "Who can see my information?", answer: "Public information and private account information are handled separately. Review the privacy policy for details. This help assistant cannot look up accounts, private organization records, or billing information.", path: "/privacy", keywords: ["privacy", "private", "data", "information", "security"] },
  { id: "signin", title: "I need help signing in", answer: "Use Sign in to access your account. Use the password recovery option there if needed. This assistant cannot change your password or grant access to an organization.", path: "/signin", keywords: ["signin", "login", "password", "access", "locked"] },
];
/** Closed public knowledge corpus. Questions never reach a private data store or general model. */
export function findPublicHelp(question: string, articles: readonly PublicHelpArticle[] = PUBLIC_HELP_ARTICLES): readonly PublicHelpArticle[] {
  const terms = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 50);
  return articles.map(article => ({ article, score: article.keywords.filter(word => terms.includes(word)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id)).slice(0, 3).map(item => item.article);
}

export const PUBLIC_HELP_PATHS = ["/join", "/signin", "/how-it-works", "/membership", "/privacy", "/terms", "/about"] as const;
/** Publication accepts plain public copy and known destination paths only. */
export function validatePublicHelpArticles(input: unknown): PublicHelpArticle[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 30) throw new Error("Publish between one and thirty help articles.");
  const ids = new Set<string>();
  return input.map(value => {
    if (!value || typeof value !== "object") throw new Error("Invalid help article.");
    const article = value as Record<string, unknown>;
    if (typeof article.id !== "string" || !/^[a-z0-9-]{1,60}$/.test(article.id) || ids.has(article.id)) throw new Error("Every help article needs a unique ID.");
    ids.add(article.id);
    for (const [field, limit] of [["title", 160], ["answer", 4000]] as const) {
      if (typeof article[field] !== "string" || !article[field].trim() || article[field].length > limit) throw new Error("An article needs a short title and a public answer.");
    }
    if (!PUBLIC_HELP_PATHS.includes(article.path as typeof PUBLIC_HELP_PATHS[number])) throw new Error("Choose a known public destination.");
    if (!Array.isArray(article.keywords) || !article.keywords.length || article.keywords.length > 30 || article.keywords.some(word => typeof word !== "string" || !/^[a-z0-9-]{1,40}$/.test(word))) throw new Error("Use up to thirty simple search keywords.");
    return { id: article.id, title: (article.title as string).trim(), answer: (article.answer as string).trim(), path: article.path as string, keywords: [...new Set(article.keywords as string[])] };
  });
}
