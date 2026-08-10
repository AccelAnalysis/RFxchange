import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  route,
  deliveryPolicy,
  deliveryAuthority,
  referralPage,
  resourcePage,
  referralWorkspace,
  resourceWorkspace,
  retryCommand,
  service,
  repository,
  runtime,
  acquisition,
  architecture,
] = await Promise.all([
  read("app/api/referrals/route.ts"),
  read("src/application/referrals/referral-invitation-delivery.ts"),
  read("src/application/referrals/referral-communication-delivery.ts"),
  read("app/referrals/page.tsx"),
  read("app/resources/page.tsx"),
  read("src/components/referrals/ReferralWorkspace.tsx"),
  read("src/components/resource-network/ResourceNetworkWorkspace.tsx"),
  read("src/components/referrals/retry-stable-command.ts"),
  read("src/application/referrals/referral-create-and-send.ts"),
  read("src/infrastructure/firestore/referrals.ts"),
  read("src/infrastructure/referrals/runtime.ts"),
  read("src/application/acquisition/acquisition-context.ts"),
  read("docs/architecture/POST_WAVE_3_STABILIZATION_1B_REFERRAL_TRANSACTION_INTEGRITY.md"),
]);

assert.match(route, /action === "create-and-send"/);
assert.match(route, /createServerReferralCreateAndSendService\(\)\.createAndSend/);
assert.match(route, /referralInvitationDeliveryPermitted/);
assert.match(route, /delivery\.blocked/);
assert.match(route, /This referral no longer permits invitation delivery/);
assert.match(deliveryPolicy, /referral\.status !== "sent"/);
assert.match(deliveryPolicy, /referral\.recipient\.kind === "external"/);
assert.match(deliveryPolicy, /referral\.attachedRecipientOrganizationId !== null/);
assert.match(deliveryPolicy, /communication\.status === "queued" \|\| communication\.status === "retryable-failure"/);
assert.match(deliveryAuthority, /getCommunication/);
assert.match(deliveryAuthority, /getReferral/);
assert.match(deliveryAuthority, /referralInvitationDeliveryPermitted\(referral, communication\)/);

assert.match(referralWorkspace, /action: "create-and-send"/);
assert.match(resourceWorkspace, /action: "create-and-send"/);
assert.doesNotMatch(referralWorkspace, /action: "education"|action: "create"|action: "send"/);
assert.doesNotMatch(resourceWorkspace, /action: "education"|action: "create"|action: "send"/);
assert.match(referralWorkspace, /createAndSendCommandRef/);
assert.match(resourceWorkspace, /providerRequestCommandRef/);
assert.match(referralWorkspace, /resolveRetryStableCommand/);
assert.match(resourceWorkspace, /resolveRetryStableCommand/);
assert.match(referralWorkspace, /commandStorageKey/);
assert.match(resourceWorkspace, /providerRequestStorageKey/);
assert.match(referralWorkspace, /encodeURIComponent\(commandRecoveryScope\)/);
assert.match(resourceWorkspace, /encodeURIComponent\(commandRecoveryScope\)/);
assert.match(referralPage, /organizationId\)}:\$\{String\(access\.membership\.id\)/);
assert.match(resourcePage, /organizationId\)}:\$\{String\(access\.membership\.id\)/);
assert.doesNotMatch(referralWorkspace, /onClick=\{\(\) => \{ clearPendingCommand\(\); setComposerOpen\(true\); \}\}/);
assert.match(referralWorkspace, /onClick=\{\(\) => setComposerOpen\(true\)\}/);
assert.match(referralWorkspace, /recipientLabel: recipientKind === "external" \? recipientLabel : null/);
assert.match(referralWorkspace, /selected\.recipientKind === "external" && selected\.recipientOrganizationId !== null/);
assert.match(retryCommand, /record\.fingerprint === fingerprint/);
assert.match(retryCommand, /DEFAULT_MAX_AGE_MS/);

assert.match(service, /type AtomicReferralAcquisitionIssuer/);
assert.match(service, /prepare\(input:/);
assert.match(service, /ReferralCreateAndSendDependencies/);
assert.match(service, /saveCreateAndSend/);
assert.match(service, /acquisition\.prepare/);
assert.doesNotMatch(service, /acquisition\.issue\(/);
assert.match(service, /reviewedRecipientLabel/);
assert.match(service, /recipientProfile\.displayName\.trim\(\) !== reviewedRecipientLabel/);
assert.match(service, /provider name changed after review/i);
assert.match(service, /referral\.version < prior\.resultingVersion/);
assert.match(service, /referral\.status === "draft"/);
assert.match(service, /communication,/);
assert.match(service, /acquisition,/);

assert.match(repository, /runTransaction/);
assert.match(repository, /transaction\.create\(referralRef/);
assert.match(repository, /transaction\.create\(educationRef/);
assert.match(repository, /ACQUISITION_CONTEXTS/);
assert.match(repository, /ACQUISITION_EVENTS/);
assert.match(repository, /return "replayed" as const/);
assert.match(runtime, /ReferralCreateAndSendDependencies/);
assert.match(runtime, /prepareTrusted/);
assert.match(runtime, /resolveReferralCommunicationDeliveryAuthority/);
assert.match(runtime, /if \(!authority\.permitted\)/);
assert.match(runtime, /service\.request/);
assert.ok(
  runtime.indexOf("resolveReferralCommunicationDeliveryAuthority") < runtime.indexOf("service.request"),
  "Provider delivery must occur only after current referral and communication authority are re-resolved.",
);
assert.match(acquisition, /prepareTrusted/);
assert.match(architecture, /one `create-and-send` command/);
assert.match(architecture, /failed Firestore transaction leaves no referral/);
assert.match(architecture, /latest authoritative referral aggregate/);
assert.match(architecture, /organization and membership/);
assert.match(architecture, /external recipient has not already attached/);
assert.match(architecture, /delivery authority boundary reloads both/);
assert.match(architecture, /Retry action is hidden/);

console.log("Referral and provider-request create-and-send transaction integrity validated.");
