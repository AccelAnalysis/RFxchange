import assert from "node:assert/strict";
import test from "node:test";

import {
  OPPORTUNITY_ALERT_LOCALES,
  normalizeOpportunityAlertLocale,
  renderOpportunityAlertMessage,
} from "../lib/opportunity-alert-locales.js";

test("opportunity alerts support every governed locale with English fallback", () => {
  assert.deepEqual(
    [...OPPORTUNITY_ALERT_LOCALES],
    ["en-US", "es", "fr", "it", "de"],
  );
  assert.equal(normalizeOpportunityAlertLocale("es-MX"), "es");
  assert.equal(normalizeOpportunityAlertLocale("fr-CA"), "fr");
  assert.equal(normalizeOpportunityAlertLocale("unsupported"), "en-US");
  assert.equal(normalizeOpportunityAlertLocale(null), "en-US");
});

test("localized alert framing preserves participant-entered opportunity content", () => {
  const summary = "Participant title — 2026-09-01 — Isle of Wight";
  const continueUrl = "https://example.test/opportunities/rfx_123";
  const subjects = new Set();
  for (const locale of OPPORTUNITY_ALERT_LOCALES) {
    const rendered = renderOpportunityAlertMessage(locale, {
      recipient: "Jordan",
      count: 2,
      summary,
      continueUrl,
    });
    subjects.add(rendered.subject);
    assert.match(rendered.text, /Jordan/);
    assert.ok(rendered.text.includes(summary));
    assert.ok(rendered.text.includes(continueUrl));
  }
  assert.equal(subjects.size, OPPORTUNITY_ALERT_LOCALES.length);
});
