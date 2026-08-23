import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Phase 4 shared cards remain media-first and bounded", () => {
  const primitives = read("src/components/participant/MobileExchangePrimitives.tsx");
  const css = read("src/components/participant/MobileExchangePrimitives.module.css");

  assert.match(primitives, /<ExchangeMedia[\s\S]*<ExchangeFavorite/);
  assert.match(primitives, /card\.classifications\.slice\(0, 2\)/);
  assert.match(primitives, /card\.metadata\.slice\(0, 2\)/);
  assert.match(primitives, /card\.recordActions\.slice\(0, 3\)/);
  assert.match(primitives, /data-owned=\{owned \? "true" : "false"\}/);
  assert.match(primitives, /data-lens=\{card\.lens\}/);
  assert.match(primitives, /className=\{styles\.actionDock\}/);
  assert.match(css, /aspect-ratio:\s*16 \/ 9/);
  assert.match(css, /-webkit-line-clamp:\s*2/);
  assert.match(css, /\.card\[data-owned="true"\]/);
});

test("semantic lens icons are first-party SVG presentation assets", () => {
  const icons = read("src/components/participant/ExchangeLensIcon.tsx");
  const primitives = read("src/components/participant/MobileExchangePrimitives.tsx");

  for (const id of ["opportunities-rfx", "resources", "intelligence", "capabilities", "menu"]) {
    assert.match(icons, new RegExp(`icon === \\"${id}\\"`));
  }
  assert.match(icons, /data-exchange-icon=\{icon\}/);
  assert.match(primitives, /<ExchangeLensIcon icon=\{lens\}/);
  assert.doesNotMatch(`${icons}\n${primitives}`, /lucide|fontawesome|maplibre|openfreemap/i);
});

test("Wave A changes presentation without introducing donor runtime authority", () => {
  const combined = [
    read("src/components/participant/ExchangeLensIcon.tsx"),
    read("src/components/participant/MobileExchangePrimitives.tsx"),
    read("src/components/participant/MobileExchangePrimitives.module.css"),
  ].join("\n");

  assert.doesNotMatch(combined, /postgres|neon|postgis|rfx_session|exchange_records|dual write/i);
  assert.doesNotMatch(combined, /<iframe|dangerouslySetInnerHTML|localStorage|sessionStorage/);
  assert.match(combined, /Repository media references are server-derived/);
});
