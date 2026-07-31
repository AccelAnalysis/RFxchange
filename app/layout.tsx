import type { Metadata } from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The RFxchange™",
    template: "%s | The RFxchange™",
  },
  description:
    "A map-based business growth network for capability discovery, opportunities, referrals, partnerships, resources, and measured activity.",
  openGraph: {
    title: "The RFxchange™",
    description:
      "Make business capability, opportunity, and connection easier to discover and act on.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
