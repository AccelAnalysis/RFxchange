import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RFxchange",
    short_name: "RFxchange",
    // The root redirects to Marketing. Launch the existing protected Exchange
    // route so sign-in, activation and organization access stay authoritative.
    start_url: "/geography/canvas",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#F8FAFC",
    prefer_related_applications: false,
    icons: [
      { src: "/icon1.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
