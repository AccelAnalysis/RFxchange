import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PARTICIPANT_SHEET_SNAP_POINTS,
  createParticipantSpatialContext,
  parseParticipantSpatialContext,
  serializeParticipantSpatialContext,
} from "../src/application/participant/participant-spatial-context.ts";
import { PARTICIPANT_LENS_IDS } from "../src/application/participant/participant-lens-registry.ts";
import { MOBILE_EXCHANGE_STAGE2_LENS_IDS } from "../src/application/participant/mobile-exchange-stage2-legacy.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const paths = Object.freeze({
  navigation: "src/components/participant/ParticipantTopNavigation.tsx",
  navigationCss: "src/components/participant/ParticipantTopNavigation.module.css",
  primitives: "src/components/participant/MobileExchangePrimitives.tsx",
  primitivesCss: "src/components/participant/MobileExchangePrimitives.module.css",
  workspace: "src/components/participant/ExistingWorkspaceFoundation.tsx",
  workspaceCss: "src/components/participant/ExistingWorkspaceFoundation.module.css",
  actionController: "src/components/participant/ExchangeRoomActionController.tsx",
  actionCss: "src/components/participant/ExchangeRoomActionController.module.css",
  shellCss: "src/components/participant/PersistentParticipantShell.module.css",
  i18nProvider: "src/components/i18n/I18nProvider.tsx",
});

test("MOB-05 renders the existing 16-action projection as four stable sheet positions without collapsing authority facts", async () => {
  const [controller, css] = await Promise.all([
    read(paths.actionController),
    read(paths.actionCss),
  ]);
  assert.match(controller, /data-action-rail-placement=\{placement\}/);
  assert.match(controller, /data-operational/);
  assert.match(controller, /data-applicable/);
  assert.match(controller, /data-authorized/);
  assert.match(controller, /data-disabled-reason/);
  assert.match(controller, /disabled/);
  assert.match(css, /position: static/);
  assert.match(css, /grid-template-columns: repeat\(4/);
});

test("sheet continuity remains presentation-only and accepts valid pre-Stage-2 stored contexts", () => {
  const scope = {
    participantId: "participant-1",
    membershipId: "membership-1",
    organizationId: "organization-1",
    geographyId: "geography-1",
  };
  const current = createParticipantSpatialContext({ scope, homeMarkerId: "marker-home" });
  assert.equal(current.sheetSnapPoint, "partial");
  assert.equal(current.sheetScrollTop, 0);
  assert.equal(parseParticipantSpatialContext(serializeParticipantSpatialContext(current), scope)?.sheetSnapPoint, "partial");

  const legacy = JSON.parse(serializeParticipantSpatialContext(current));
  delete legacy.sheetSnapPoint;
  delete legacy.sheetScrollTop;
  const restored = parseParticipantSpatialContext(JSON.stringify(legacy), scope);
  assert.equal(restored?.sheetSnapPoint, "partial");
  assert.equal(restored?.sheetScrollTop, 0);
});

test("all five governed locales carry complete Stage 2 sheet, card, and record-action copy", async () => {
  const localePaths = ["en-US", "es", "fr", "it", "de"].map(
    (locale) => `src/i18n/messages/network/mobile-exchange-stage2/${locale}.json`,
  );
  const catalogs = await Promise.all(localePaths.map(async (path) => JSON.parse(await read(path))));
  const expectedSheetKeys = ["region", "dragHandle", "peek", "partial", "expanded"];
  const expectedCardKeys = ["openDetail", "addFavorite", "removeFavorite", "favoriteUnavailable", "mediaFallback"];
  const expectedRecordActionKeys = [
    "resources.recordActions.viewProvider",
    "resources.recordActions.viewResource",
    "resources.recordActions.requestSupport",
    "resources.recordActions.openIntake",
    "resources.recordActions.viewRequest",
  ];
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog.sheet), expectedSheetKeys);
    assert.deepEqual(Object.keys(catalog.card), expectedCardKeys);
    assert.deepEqual(Object.keys(catalog.recordActions), expectedRecordActionKeys);
    assert.ok(Object.values(catalog.sheet).every((value) => typeof value === "string" && value.length > 0));
    assert.ok(Object.values(catalog.card).every((value) => typeof value === "string" && value.length > 0));
    for (const key of expectedRecordActionKeys) {
      assert.equal(typeof catalog.recordActions[key], "string");
      assert.ok(catalog.recordActions[key].length > 0);
      assert.notEqual(catalog.recordActions[key], key);
    }
  }
});
