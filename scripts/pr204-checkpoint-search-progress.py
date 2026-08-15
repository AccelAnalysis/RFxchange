from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one marker in {path}, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


worker = Path("functions/src/opportunity-discovery-evaluation-functions.ts")
replace_once(
    worker,
    '''    for (const document of page.docs) {
      const search = document.data() as SavedSearch;
      if (search.status !== "active" || !matches(projection, search, now)) continue;
      try {
        await saveMatch(db, search, projection, now);
      } catch (error) {
        if (error instanceof SavedSearchAuthorityChangedError) continue;
        throw error;
      }
    }
    const nextCursorId = page.docs.at(-1)?.id ?? null;
    if (!nextCursorId) break;
    await checkpointEvaluation(db, evaluationId, claimId, nextCursorId);
    cursorId = nextCursorId;
    if (page.size < PAGE_SIZE) break;
''',
    '''    for (const document of page.docs) {
      const search = document.data() as SavedSearch;
      if (search.status === "active" && matches(projection, search, now)) {
        try {
          await saveMatch(db, search, projection, now);
        } catch (error) {
          if (!(error instanceof SavedSearchAuthorityChangedError)) throw error;
        }
      }
      await checkpointEvaluation(db, evaluationId, claimId, document.id);
      cursorId = document.id;
    }
    if (page.size < PAGE_SIZE) break;
''',
)

contract = Path("test/wave4-direct-gap-convergence.test.mjs")
replace_once(
    contract,
    '''  assert.match(evaluationWorker, /error instanceof SavedSearchAuthorityChangedError\) continue/);
  assert.match(evaluationWorker, /savedSearchCursorId/);
  assert.match(evaluationWorker, /async function checkpointEvaluation/);
  assert.match(evaluationWorker, /query = query\.startAfter\(cursorId\)/);
  assert.match(
    evaluationWorker,
    /await checkpointEvaluation\(db, evaluationId, claimId, nextCursorId\)/,
    "Every fully processed saved-search page must persist its continuation cursor before the worker advances.",
  );
''',
    '''  assert.match(evaluationWorker, /error instanceof SavedSearchAuthorityChangedError/);
  assert.match(evaluationWorker, /savedSearchCursorId/);
  assert.match(evaluationWorker, /async function checkpointEvaluation/);
  assert.match(evaluationWorker, /query = query\.startAfter\(cursorId\)/);
  assert.match(
    evaluationWorker,
    /for \(const document of page\.docs\) \{[\s\S]{0,600}await checkpointEvaluation\(db, evaluationId, claimId, document\.id\)[\s\S]{0,80}cursorId = document\.id/,
    "Every completed saved-search record must persist its continuation cursor before the worker advances.",
  );
  assert.doesNotMatch(
    evaluationWorker,
    /await checkpointEvaluation\(db, evaluationId, claimId, nextCursorId\)/,
    "A page-boundary-only checkpoint can replay the same page indefinitely after a timeout.",
  );
''',
)
