import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createActivationLegalAcceptance, isCurrentActivationLegalAcceptance } from '../src/domain/onboarding/model.ts';
import { CURRENT_PLATFORM_POLICY_VERSION } from '../src/domain/legal/model.ts';
import { COMMUNICATION_CONSENT_VERSION, communicationSendDecision, DEFAULT_LIFECYCLE_POLICY } from '../src/domain/communications/lifecycle.ts';

test('prior legal acceptance is preserved but cannot satisfy the revised policy gate', () => {
  const accepted = createActivationLegalAcceptance('2026-09-12T20:00:00Z');
  assert.equal(accepted.policyVersion, CURRENT_PLATFORM_POLICY_VERSION);
  assert.equal(isCurrentActivationLegalAcceptance(accepted), true);
  assert.equal(isCurrentActivationLegalAcceptance({ ...accepted, policyVersion: '2026.07.31' }), false);
  assert.equal(isCurrentActivationLegalAcceptance({ ...accepted, acceptedTerms: false }), false);
});

test('stale SMS consent cannot authorize delivery after disclosures change', () => {
  const state = { userId: 'u1', organizationId: null, active: false, accountAvailable: true, registeredAt: '2026-09-01T12:00:00Z', lastActivityAt: '2026-09-01T12:00:00Z' };
  const preferences = { userId: 'u1', version: 1, email: false, sms: true, marketingConsent: true, phone: '+17575550100', timeZone: 'UTC', consentTextVersion: 'rfxchange-communications-2026-09-12', updatedAt: '2026-09-11T12:00:00Z' };
  const input = { state, preferences, policy: { ...DEFAULT_LIFECYCLE_POLICY, enabled: true }, journey: 'finish-setup', channel: 'sms', suppressed: false, lastSentAt: null, now: Date.parse('2026-09-12T15:00:00Z') };
  assert.equal(communicationSendDecision(input), 'consent-required');
  assert.equal(communicationSendDecision({ ...input, preferences: { ...preferences, consentTextVersion: COMMUNICATION_CONSENT_VERSION } }), null);
});

test('policy submission checks the displayed version before recording acceptance', async () => {
  const route = await readFile(new URL('../app/api/onboarding/activation/route.ts', import.meta.url), 'utf8');
  assert.ok(route.indexOf('body.policyVersion !== CURRENT_PLATFORM_POLICY_VERSION') < route.indexOf('service.acceptLegal(context)'));
  assert.match(route, /code: "policy-version-changed"/);
});
