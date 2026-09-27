import assert from "node:assert/strict";
import test from "node:test";
import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

test("Functions initializes a default app when only a named app exists", async () => {
  const named = initializeApp({ projectId: "demo-rfxchange" }, "emulator-internal");
  try {
    const { getFunctionsAdminApp, getFunctionsFirestore } = await import("../lib/runtime/firebase-admin.js?named-only");
    const app = getFunctionsAdminApp();
    assert.equal(app.name, "[DEFAULT]");
    assert.notEqual(app, named);
    assert.equal(getFunctionsAdminApp(), app);
    assert.equal(getFunctionsFirestore(), getFirestore(app));
  } finally {
    await Promise.all(getApps().map(deleteApp));
  }
});

test("Functions reuses an existing default app alongside named apps", async () => {
  const app = initializeApp({ projectId: "demo-rfxchange" });
  initializeApp({ projectId: "demo-other" }, "other");
  try {
    const { getFunctionsAdminApp } = await import("../lib/runtime/firebase-admin.js?existing-default");
    assert.equal(getFunctionsAdminApp(), app);
    assert.equal(getApps().length, 2);
  } finally {
    await Promise.all(getApps().map(deleteApp));
  }
});
