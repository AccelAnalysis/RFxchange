# RFxchange Home Screen app

The Exchange supports installation with a web app manifest at
`/manifest.webmanifest`, standalone display, RF monogram icons, and Apple
Home Screen metadata. The icon follows the existing `RFMark` primitive and
Design System v2 slate/gold colors. The maskable icon keeps its lettering
inside the central safe area.

Installation starts at `/geography/canvas`, not `/`: the root intentionally
redirects to the separately hosted Marketing application. The existing
Exchange route still enforces sign-in, activation and organization access.
The manifest scope is the Exchange origin; Marketing, Admin and other external
destinations retain their normal browser handling.

On iPhone/iPad, open an Exchange page in Safari and choose Share → Add to Home
Screen. Enable Open as Web App if offered, then Add. If an older shortcut opens
as a browser bookmark, remove that shortcut and add it again after deployment.
Supporting desktop/Android browsers expose their own install action.

This is an online app. Installation does not add offline transactions, push
notifications, background sync or a service worker that caches private pages.
Updates continue through the existing Firebase App Hosting release process.

Before release, check that the built Exchange serves its manifest and all
referenced PNGs publicly, emits the manifest/Apple metadata on sign-in, and
redirects an unauthenticated manifest launch to sign-in on the same origin.
Repeat these checks on the released origin. Device-level Home Screen launch
still needs an actual iPhone/iPad; desktop HTTP checks do not establish it.

References: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps),
[MDN installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
