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
const english = JSON.parse(read("src/i18n/messages/marketing-pages/en-US.json"));

assert.match(home, /marketingPages\.home/, "Home must consume the localized marketing-pages namespace");
assert.match(founding, /marketingPages\.founding/, "Founding must consume the localized marketing-pages namespace");
assert.match(home, /<MarketingAvailability/, "Home must use the shared availability component");
assert.match(founding, /<MarketingAvailability/, "Founding must use the shared availability component");
assert.match(foundersRedirect, /redirect\("\/founding"\)/, "/founders must redirect to the canonical /founding route");
assert.match(availability, /item\.kind === "live"/, "Availability must distinguish live from later pathways");
assert.match(marketing, /publicValueProgression/, "Public content must retain the customer-value progression");
assert.equal(english.home.value.items.length, 4, "Home value progression must contain four stages");
assert.equal(english.home.how.steps.length, 6, "Home explanation must contain six governed stages");
assert.equal(english.availability.items.filter((item) => item.kind === "live").length, 3, "Exactly three post-Wave 3 availability groups should be live");
assert.equal(english.availability.items.filter((item) => item.kind === "planned").length, 1, "Later domains must remain visibly planned");
assert.match(english.home.ai.title, /AI can suggest\. People confirm\./, "AI authority boundary must remain explicit");
assert.match(english.founding.hero.readiness, /Paid enrollment opens only after/, "Founding billing readiness must remain truthful");
assert.match(english.founding.comparison.footnote, /not Verification/, "Founding recognition must remain separate from verification");
assert.doesNotMatch(home, /invented|guaranteed leads/i, "Home must not introduce fabricated or guaranteed-activity claims");

console.log("Post-Wave 3 marketing surfaces validated.");
