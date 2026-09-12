# RFxchange Marketing

Independent public Next.js application for Firebase project `rfxchange`, registered Web App `1:820964688242:web:a0d73136aba27643e1ddeb`. The App Hosting root is `apps/marketing`.

The application owns public product and audience pages, membership information, Founding campaign content and policy destinations. It uses the bright Design System v2 palette and existing approved image references, credits, translations and capability availability statements. Historical example prices are omitted; core participation is free and Founding enrollment remains closed. This application does not change commercial configuration or enable checkout.

## Build and checks

From the repository root:

```sh
npm ci
npm run typecheck:marketing
npm run build:marketing
node scripts/smoke-marketing-application.mjs
```

The HTTP smoke check also needs the root Exchange production build. The full `npm run check` builds both and exercises public pages, five locales, campaign precedence, unsafe return destinations and the two-origin registration handoff.

## Registration and acquisition

`/join`, `/signin` and `/acquisition/founding` redirect only to `/acquisition/entry` on `NEXT_PUBLIC_RFXCHANGE_EXCHANGE_ORIGIN`. The configured origin is validated and must be HTTPS in production. Marketing does not establish an Exchange session or copy credentials between hosts.

An optional bounded `utm_campaign` is retained as first-touch, host-only reported attribution. The handoff preserves that campaign and a supported language; it forwards no arbitrary query fields or cookies. Exchange sets its own host-only context before registration/sign-in. After successful authentication and activation bootstrap, campaign attribution may bind through the existing acquisition service as **direct entry**. An existing referral, opportunity, invitation or bound acquisition context takes precedence. A campaign never grants referral credit, organization authority or commercial entitlement.

Before a manual rollout, set `RFXCHANGE_BUILD_SHA` to the exact merged source SHA and keep automatic rollouts disabled unless release automation sets that value correctly. Deploy the Exchange receiver before exposing Marketing registration links. The cutover retires old public implementations and redirects legacy Exchange public paths here. Release it only after this application is live and checked. Supported locale handoffs set a host-only preference and redirect once to the clean public URL.

App Hosting recognizes the root `nx.json` and per-application `project.json` files, so it installs from the repository lockfile and retains shared sources. Each Nx build target executes the existing Next.js build in its own directory; build caching and Nx Cloud are disabled for release builds. Shared Next configuration lives in `src/config/next-config.ts`, outside the entry file rewritten by the Firebase adapter.
