# RFx Slice 4.7 verification commands

Run from a clean checkout with repository Node.js 24.18.x:

```bash
node --experimental-strip-types --test test/rfx47-teaming.test.mjs test/rfx47-workspace.test.mjs
npx firebase emulators:exec --only firestore --project demo-rfxchange "node --experimental-strip-types scripts/rfx47-firestore-emulator.mjs"
npm run check
git diff --check
```

The focused suite proves the immutable gap context, exact server-governed candidate boundary, invitation lifecycle/replay, acquisition binding, nonbinding acceptance, safe Resource handoff, existing-organization inbox, five-locale key/copy parity, and explicit response/submission stop boundary.

The emulator uses synthetic test-only records in the Firestore emulator. It proves one atomic internal invitation, one atomic external acquisition/communication invitation, exact replay without duplicate evidence, exact bound-recipient acceptance with localized boundary evidence, direct-client denial, and cleanup. No test record enters a configured or production project.

`npm run check` is the canonical repository gate and supplies validation, Functions, architecture, typecheck, lint, and clean-checkout production-build evidence. Production CI must pass on the exact pull-request candidate and again on merged `main`. The ordinary configured Exchange browser harness is applicable as a regression for persistent-shell order, desktop/mobile, keyboard/accessibility, five locales, reduced motion, clean console, and compiled/visible identity; it is not evidence of external email-provider delivery or a production-network promise.

The exact candidate SHA, exact-head run, merge SHA, and post-merge run are recorded by the pull request and subsequent Control Room closeout rather than guessed in this pre-merge artifact.
