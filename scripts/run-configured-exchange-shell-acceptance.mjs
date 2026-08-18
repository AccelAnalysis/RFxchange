#!/usr/bin/env node

// The canonical harness now contains the Stage 2 reopen regression and the successor lens
// expectations directly. Keep this stable package-script entry point without runtime source edits.
await import("./acceptance-exchange-shell-emulator.mjs");
