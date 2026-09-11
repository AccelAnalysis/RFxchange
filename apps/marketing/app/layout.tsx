import type { Metadata } from "next";
import { I18nProvider } from "@/src/components/i18n/I18nProvider";
import { getMarketingDictionary as getRequestDictionary } from "@/apps/marketing/dictionary";
import "@/src/design/semantic-tokens.css";
import "@/app/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RFxchange", template: "%s | RFxchange" },
};

export default async function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, dictionary } = await getRequestDictionary();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} dictionary={dictionary}>{children}</I18nProvider>
      </body>
    </html>
  );
}
