import type { Metadata } from "next";
import { I18nProvider } from "@/src/components/i18n/I18nProvider";
import { getRequestDictionary } from "@/src/i18n/server";
import "@/src/design/semantic-tokens.css";
import "@/app/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RFxchange Admin", template: "%s | RFxchange Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, dictionary } = await getRequestDictionary();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} dictionary={dictionary}>{children}</I18nProvider>
      </body>
    </html>
  );
}
