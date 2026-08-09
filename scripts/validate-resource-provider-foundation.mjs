import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (value) => fs.readFileSync(path.join(root, value), "utf8");
const model = read("src/domain/resource-providers/model.ts");
const service = read("src/application/resource-providers/provider-foundation.ts");
const rules = read("firestore.rules");
const participant = read("src/components/resource-providers/ProviderApplicationWorkspace.tsx");
const admin = read("src/components/resource-providers/ProviderReviewConsole.tsx");
const discovery = ["src/application/network-discovery/network-discovery.ts", "src/infrastructure/network-discovery/runtime.ts"].map(read).join("\n");

for (const status of ["draft", "submitted", "under-review", "information-requested", "resubmitted", "approved", "denied"]) assert.match(model, new RegExp(`"${status}"`));
for (const permission of ["resource.manage", "provider.application.read", "provider.application.review"]) assert.match(service, new RegExp(permission.replace(".", "\\.")));
for (const collection of ["providerApplications", "providerApplicationVersions", "providerApplicationEvents", "providerApplicationCommands", "officialResourceProviderStatuses", "providerServiceProfiles"]) assert.match(rules, new RegExp(`match /${collection}`));
assert.match(model, /visibility: "owner-and-administrators"/);
assert.doesNotMatch(discovery, /officialResourceProviderStatuses|providerServiceProfiles|OfficialResourceProvider/);
assert.match(participant, /Request Resource Provider Status|resourceProviderWorkspace\.title/);
assert.match(participant, /not Organization Verified|resourceProviderWorkspace\.boundary/);
assert.match(admin, /Minimum-necessary application/);
for (const locale of ["en-US", "es", "fr", "it", "de"]) assert.ok(fs.existsSync(path.join(root, `src/i18n/messages/resource-providers/${locale}.json`)));
console.log("Resource Provider foundation validation passed: governed lifecycle, scoped authority, private profile, and non-public boundary are present.");
