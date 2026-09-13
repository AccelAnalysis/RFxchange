import type { Metadata, Viewport } from "next";

import "mapbox-gl/dist/mapbox-gl.css";
import "../src/design/semantic-tokens.css";
import "./globals.css";

import { I18nProvider } from "@/src/components/i18n/I18nProvider";
import { PersistentParticipantShell } from "@/src/components/participant/PersistentParticipantShell";
import { getRequestDictionary } from "@/src/i18n/server";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8FAFC",
};

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();

  return {
    title: {
      default: dictionary.metadata.title,
      template: `%s | ${dictionary.metadata.title}`,
    },
    description: dictionary.metadata.description,
    applicationName: "RFxchange",
    appleWebApp: {
      capable: true,
      title: "RFxchange",
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icons/rf-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/rf-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: { url: "/icons/rf-180.png", sizes: "180x180", type: "image/png" },
    },
    openGraph: {
      title: dictionary.metadata.title,
      description: dictionary.metadata.openGraphDescription,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, dictionary } = await getRequestDictionary();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <I18nProvider dictionary={dictionary} locale={locale}>
          <PersistentParticipantShell>{children}</PersistentParticipantShell>
        </I18nProvider>
      </body>
    </html>
  );
}
