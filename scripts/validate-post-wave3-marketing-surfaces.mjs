import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const home = read("app/page.tsx");
const founding = read("app/founding/page.tsx");
const foundersRedirect = read("app/founders/page.tsx");
const availability = read("src/components/marketing/MarketingAvailability.tsx");
const marketing = read("src/content/marketing.ts");
const chrome = read("src/components/marketing/MarketingChrome.tsx");
const responsiveChrome = read("src/components/marketing/MarketingChromeResponsive.module.css");
const foundingEntry = read("app/acquisition/founding/route.ts");
const homeScene = read("app/api/onboarding/home-scene/route.ts");
const geographyCanvas = read("app/geography/canvas/page.tsx");
const orientation = read("app/orientation/page.tsx");
const exchange = read("app/exchange/page.tsx");
const continuation = read("src/components/acquisition/FoundingAcquisitionContinuation.tsx");
const englishText = read("src/i18n/messages/marketing-pages/en-US.json");
const english = JSON.parse(englishText);

assert.match(home, /marketingPages\.home/, "Home must consume the localized marketing-pages namespace");
assert.match(founding, /marketingPages\.founding/, "Founding must consume the localized marketing-pages namespace");
assert.match(home, /<MarketingAvailability/, "Home must use the shared availability component");
assert.match(founding, /<MarketingAvailability/, "Founding must use the shared availability component");
assert.match(foundersRedirect, /permanentRedirect\("\/founding"\)/, "/founders must permanently redirect to canonical /founding");
assert.match(founding, /foundingActivationHref = "\/acquisition\/founding"/, "Founding conversion actions must enter the persisted acquisition path");
assert.match(foundingEntry, /httpOnly: true/, "Founding campaign intent must be persisted server-side");
assert.match(homeScene, /appendFoundingAcquisitionIntent/, "Activation completion must carry Founding intent into the Exchange");
for (const [name, surface] of Object.entries({ geographyCanvas, orientation })) {
  assert.match(surface, /FoundingAcquisitionContinuation/, `${name} must consume preserved Founding intent on a participant destination`);
  assert.match(surface, /acquisitionIntent/, `${name} must parse the Founding acquisition query`);
}
assert.match(exchange, /resolveFoundingAcquisitionIntent/, "Exchange entry must parse the Founding acquisition query");
assert.match(exchange, /appendFoundingAcquisitionIntent\("\/geography\/canvas"\)/, "Exchange entry must carry Founding intent to the map shell");
assert.match(continuation, /href="\/commercial\/founding"/, "Preserved post-value Founding intent must continue to the commerce surface");
assert.match(chrome, /MarketingChromeResponsive/, "Marketing navigation must consume the responsive collapse contract");
assert.match(chrome, /<details className=\{responsive\.navMenu\}/, "Long localized marketing navigation must have an accessible collapsed menu");
assert.match(chrome, /responsive\.mobileActions/, "Marketing actions must participate in the mobile layout contract");
assert.match(responsiveChrome, /max-width: 1320px/, "Marketing navigation must collapse before intermediate-width overflow");
assert.match(responsiveChrome, /grid-template-areas:[\s\S]*"brand menu"[\s\S]*"actions actions"/, "Mobile marketing navigation must use a two-row layout");
assert.match(responsiveChrome, /max-width: 520px/, "Narrow mobile controls must stack the language selector above actions");
assert.match(availability, /item\.kind === "live"/, "Availability must distinguish current from upcoming pathways");
assert.match(marketing, /publicValueProgression/, "Public content must retain the customer-value progression");
assert.equal(english.home.value.items.length, 4, "Home value progression must contain four stages");
assert.equal(english.home.how.steps.length, 6, "Home explanation must contain six customer-facing stages");
assert.equal(english.availability.items.filter((item) => item.kind === "live").length, 3, "Exactly three availability groups should be current");
assert.equal(english.availability.items.filter((item) => item.kind === "planned").length, 1, "Upcoming tools must remain visibly identified");
assert.match(english.home.ai.title, /AI can suggest\. People confirm\./, "AI human-confirmation boundary must remain explicit");
assert.match(english.founding.hero.readiness, /Paid enrollment opens when/, "Founding billing readiness must remain truthful");
assert.match(english.founding.comparison.footnote, /not verification/i, "Founding recognition must remain separate from verification");
assert.doesNotMatch(englishText, /Next governed pathway|Wave 3 is complete|governed assistance|authoritative state|later governed work/i, "Marketing localization must not expose internal delivery language");
assert.doesNotMatch(home, /guaranteed leads/i, "Home must not introduce guaranteed-activity claims");

console.log("Public marketing surfaces validated.");
