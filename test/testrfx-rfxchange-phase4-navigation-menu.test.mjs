import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("all four successor lenses use real current routes and Referrals remains a utility", () => {
  const registry = read("src/application/participant/participant-lens-registry.ts");
  const primary = registry.slice(
    registry.indexOf("export const PARTICIPANT_LENSES"),
    registry.indexOf("export const PARTICIPANT_UTILITY_DESTINATIONS"),
  );

  for (const route of ["/opportunities", "/resources", "/geography/canvas", "/capabilities"]) {
    assert.match(primary, new RegExp(`href: \\"${route.replaceAll("/", "\\/")}\\"`));
  }
  assert.match(primary, /id: "capabilities"[\s\S]*availability: "enabled"/);
  assert.doesNotMatch(primary, /id: "referrals"/);
  assert.match(registry, /referrals: Object\.freeze\([\s\S]*managementHref: "\/referrals\?intent=manage"/);
  assert.match(registry, /"\/capabilities"/);
});

test("mobile navigation has four semantic lenses plus one Menu utility", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const css = read("src/components/participant/ParticipantTopNavigation.module.css");

  assert.match(navigation, /<LensItems[\s\S]*mobile/);
  assert.match(navigation, /<MobileMenuUtility/);
  assert.match(navigation, /<ExchangeLensIcon icon=\{lens\.id\}/);
  assert.match(navigation, /<ExchangeLensIcon icon="menu"/);
  assert.match(navigation, /data-mobile-menu-trigger/);
  assert.match(navigation, /role="menu"/);
  assert.match(navigation, /role="menuitem"/);
  assert.match(navigation, /ArrowDown/);
  assert.match(navigation, /ArrowUp/);
  assert.match(navigation, /Home/);
  assert.match(navigation, /End/);
  assert.match(navigation, /Escape/);
  assert.match(css, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.mobileMenuSurface/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /@media \(max-width: 390px\)/);
});

test("Menu destinations reuse current server-authorized account utilities", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");

  assert.match(navigation, /PARTICIPANT_UTILITY_DESTINATIONS\.account\.href/);
  assert.match(navigation, /PARTICIPANT_UTILITY_DESTINATIONS\["quick-start"\]\.href/);
  assert.match(navigation, /PARTICIPANT_UTILITY_DESTINATIONS\.referrals\.managementHref/);
  assert.match(navigation, /fetch\("\/api\/participant-shell\/administration"/);
  assert.match(navigation, /<SignOutButton/);
  assert.doesNotMatch(navigation, /localStorage|document\.cookie|firebase|authorization|membership|roleClaims/);
});

test("all five locale dictionaries retain identical participant-navigation keys", () => {
  const locales = ["en-US", "es", "fr", "it", "de"];
  const dictionaries = locales.map((locale) => JSON.parse(
    read(`src/i18n/messages/participant-navigation/${locale}.json`),
  ));
  const keys = Object.keys(dictionaries[0]).sort();

  for (const dictionary of dictionaries) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    assert.ok(dictionary.menu.trim());
    assert.ok(dictionary.loadingCapabilitiesBody.trim());
    assert.doesNotMatch(dictionary.loadingCapabilitiesBody, /unavailable|indisponible|nicht verfügbar|no está disponible|non è disponibile/i);
  }
});

test("the shared navigation port introduces no donor runtime or duplicate shell", () => {
  const combined = [
    read("src/application/participant/participant-lens-registry.ts"),
    read("src/components/participant/ParticipantTopNavigation.tsx"),
    read("src/components/participant/ParticipantTopNavigation.module.css"),
  ].join("\n");

  assert.doesNotMatch(combined, /postgres|postgis|neon|maplibre|openfreemap|rfx_session|exchange_records/i);
  assert.doesNotMatch(combined, /new PersistentParticipantShell|createContext\(/);
  assert.doesNotMatch(combined, /window\.location|document\.location|location\.assign|location\.replace/);
});
