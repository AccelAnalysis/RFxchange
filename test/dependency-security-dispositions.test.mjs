import test from "node:test";

test("documented residual dependency findings remain inside their reviewed boundaries", async () => {
  await import("../scripts/validate-dependency-security-dispositions.mjs");
});
