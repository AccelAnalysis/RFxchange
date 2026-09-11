import { getRequestDictionary } from "@/src/i18n/server";
import type { Locale } from "@/src/i18n/config";

// Published enrollment remains closed. Historical $49 illustrations are not a new price offer.
const copy: Record<Locale, { enrollment: string; question: string; policies: string }> = {
  "en-US": { enrollment: "Founding enrollment is not open yet. Core participation is free.", question: "Is Founding enrollment open?", policies: "Policies" },
  es: { enrollment: "La inscripción fundadora aún no está abierta. La participación básica es gratuita.", question: "¿Está abierta la inscripción fundadora?", policies: "Políticas" },
  fr: { enrollment: "Les inscriptions fondatrices ne sont pas encore ouvertes. La participation de base est gratuite.", question: "Les inscriptions fondatrices sont-elles ouvertes ?", policies: "Politiques" },
  it: { enrollment: "Le iscrizioni fondatrici non sono ancora aperte. La partecipazione di base è gratuita.", question: "Le iscrizioni fondatrici sono aperte?", policies: "Politiche" },
  de: { enrollment: "Die Gründungsmitgliedschaft ist noch nicht geöffnet. Die Basisteilnahme ist kostenlos.", question: "Ist die Anmeldung zur Gründungsmitgliedschaft geöffnet?", policies: "Richtlinien" },
};

export async function getMarketingDictionary() {
  const { locale, dictionary } = await getRequestDictionary();
  return {
    locale,
    dictionary: {
      ...dictionary,
      marketingPages: {
        ...dictionary.marketingPages,
        founding: {
          ...dictionary.marketingPages.founding,
          hero: { ...dictionary.marketingPages.founding.hero, price: copy[locale].enrollment },
          comparison: {
            ...dictionary.marketingPages.founding.comparison,
            founding: { ...dictionary.marketingPages.founding.comparison.founding, price: copy[locale].enrollment },
          },
          cta: { ...dictionary.marketingPages.founding.cta, note: copy[locale].enrollment },
          faq: {
            ...dictionary.marketingPages.founding.faq,
            items: [
              ...dictionary.marketingPages.founding.faq.items.slice(0, 4),
              { question: copy[locale].question, answer: copy[locale].enrollment },
            ],
          },
        },
      },
      marketing: { ...dictionary.marketing, footer: { ...dictionary.marketing.footer, bottomMatter: copy[locale].policies } },
    },
  };
}
