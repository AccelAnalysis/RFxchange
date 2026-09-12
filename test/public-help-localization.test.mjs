import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PUBLIC_HELP_ARTICLES, findPublicHelp, validatePublicHelpArticles } from '../src/application/support/public-help.ts';
import { localizePublicHelpArticles } from '../src/application/support/localize-public-help.ts';
import { isPersistentParticipantPath, participantUtilityForPathname } from '../src/application/participant/participant-lens-registry.ts';
const copy = locale => JSON.parse(readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8')).interface.services.help.articles;

test('the bundled guide answers localized questions in all five locales without changing public destinations', () => {
  for (const [locale, question] of [['en-US', 'capabilities'], ['es', 'capacidades'], ['fr', 'capacites'], ['it', 'capacità'], ['de', 'Fähigkeiten']]) {
    const localized = localizePublicHelpArticles(PUBLIC_HELP_ARTICLES, copy(locale));
    assert.equal(findPublicHelp(question, localized)[0]?.id, 'capabilities', locale);
    assert.deepEqual(localized.map(article => article.path), PUBLIC_HELP_ARTICLES.map(article => article.path));
  }
});

test('localization preserves operator edits and custom published articles, even when bundled IDs are reused', () => {
  const original = PUBLIC_HELP_ARTICLES[0];
  for (const patch of [{ title: 'Approved custom question' }, { answer: 'Approved current public answer' }, { path: '/about' }, { keywords: ['approved'] }, { id: 'custom-help' }]) {
    const edited = { ...original, ...patch };
    const [result] = localizePublicHelpArticles([edited], copy('fr'));
    assert.equal(result, edited);
  }
  assert.equal(PUBLIC_HELP_ARTICLES[0].title, 'How do I join?');
});

test('accented public search keywords remain bounded and destination validation stays enforced', () => {
  const article = { ...PUBLIC_HELP_ARTICLES[2], keywords: ['capacités', 'fähigkeiten'] };
  assert.equal(validatePublicHelpArticles([article]).length, 1);
  assert.equal(findPublicHelp('CAPACITES', [article])[0]?.id, article.id);
  assert.throws(() => validatePublicHelpArticles([{ ...article, keywords: ['<script>'] }]));
  assert.throws(() => validatePublicHelpArticles([{ ...article, path: '/admin' }]));
});

test('account communication settings preserve the existing participant shell while sign-in remains outside it', () => {
  assert.equal(isPersistentParticipantPath('/account/communications'), true);
  assert.equal(participantUtilityForPathname('/account/communications'), 'account');
  assert.equal(isPersistentParticipantPath('/signin'), false);
  assert.equal(isPersistentParticipantPath('/account/unrecognized'), false);
});
