import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichPublicOrganization } from '../lib/application/public-enrichment.js';
import { publicEnrichmentAdapters } from '../lib/runtime/public-enrichment-adapters.js';
const subject = { organizationId: 'org-a', displayName: 'Example LLC', uei: 'ABCDEFGHIJK1' };
const now = () => '2026-09-12T12:00:00.000Z';
test('fan-out isolates failures and preserves conflicting names as findings', async () => {
  let started = 0; let release; const wait = new Promise(resolve => { release = resolve; });
  const adapters = [
    { source: 'sam', async lookup() { started++; await wait; return { source: 'sam', status: 'succeeded', retrievedAt: now(), findings: [{ field: 'legalName', value: 'Other Legal Name', sourceReference: 'https://sam.gov/', confidence: .5 }], errorCode: null }; } },
    { source: 'usaspending', async lookup() { started++; release(); throw Error('API KEY PRIVATE'); } },
  ];
  const result = await enrichPublicOrganization('run1', subject, adapters, now);
  assert.equal(started, 2); assert.equal(result.status, 'partial'); assert.equal(result.conflicts[0].currentValue, 'Example LLC');
  assert.equal(subject.displayName, 'Example LLC'); assert.equal(result.sourceResults[1].errorCode, 'source-unavailable'); assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
test('unconfigured SAM and unknown UEI are explicit nonfatal outcomes, with no API call', async () => {
  let calls = 0;
  const result = await enrichPublicOrganization('run2', { ...subject, uei: null }, publicEnrichmentAdapters(undefined, async () => { calls++; throw Error('must not fetch'); }, now), now);
  assert.equal(calls, 0); assert.deepEqual(result.sourceResults.map(r => r.errorCode), ['sam-not-configured', 'uei-required']);
});
test('SAM discards mismatched UEIs and never retains credentials or full payload', async () => {
  const adapters = publicEnrichmentAdapters('SECRET', async url => {
    assert.equal(url.origin, 'https://api.sam.gov'); assert.equal(url.searchParams.get('ueiSAM'), subject.uei);
    return Response.json({ entityData: [{ entityRegistration: { ueiSAM: subject.uei, legalBusinessName: 'Example LLC', registrationStatus: 'Active', privateContact: 'do not retain' } }, { entityRegistration: { ueiSAM: 'ZZZZZZZZZZZ1', legalBusinessName: 'Wrong business' } }] });
  }, now);
  const result = await adapters[0].lookup(subject);
  assert.equal(result.findings.length, 3); assert.ok(!JSON.stringify(result).includes('SECRET')); assert.ok(!JSON.stringify(result).includes('Wrong business')); assert.ok(!JSON.stringify(result).includes('do not retain'));
});
test('award enrichment requires matching response UEI and retains only bounded public fields', async () => {
  const adapters = publicEnrichmentAdapters('', async (url, init) => {
    assert.equal(JSON.parse(init.body).filters.recipient_search_text[0], subject.uei);
    return Response.json({ results: [{ 'Recipient UEI': subject.uei, 'Award ID': 'award-1', generated_internal_id: 'CONT_AWD_1', Description: 'Public award' }, { 'Recipient UEI': 'OTHER', 'Award ID': 'wrong', generated_internal_id: 'wrong' }] });
  }, now);
  const result = await adapters[1].lookup(subject);
  assert.equal(result.findings.length, 1); assert.match(result.findings[0].sourceReference, /CONT_AWD_1/);
});
