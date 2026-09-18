import path from "node:path";
import type { NextConfig } from "next";
import shared from "../../src/config/next-config.ts";
const repositoryRoot = path.resolve(__dirname, "../..");
const config: NextConfig = {
  ...shared,
  outputFileTracingRoot: repositoryRoot,
  outputFileTracingIncludes: {"/*": ["./public/index.html"]},
  turbopack: {root: repositoryRoot},
  async headers() {
    return [{source:"/:path*", headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"same-origin"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(self)"},
      {key:"Content-Security-Policy",value:"default-src 'self'; script-src 'self' https://www.gstatic.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https://*.mapbox.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.mapbox.com; worker-src 'self' blob:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"}
    ]}, {source:"/api/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}]},
       {source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache"}]}];
  }
};
export default config;
