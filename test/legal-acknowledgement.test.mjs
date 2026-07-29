import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  REQUIRED_ACKNOWLEDGEMENT_STATUS,
  REQUIRED_LEGAL_DOCUMENT_KINDS,
  createLegalAcknowledgement,
  createLegalDocumentVersion,
  resolveLegalAcknowledgementGate,
} from "../src/domain/legal/model.ts";

const now = "2026-07-29T12:30:00.000Z";

function fixture() {
  const organization = createOrganizationAccount({ id: "org-alpha", now });
  const user = createUserIdentity({
    id: "user-one",
    name: "User One",
    primaryEmail: "user@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-1",
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: "membership-1",
    now,
  });

  return { organization, user, membership };
}

function versions(suffix = "1.0") {
  return [
    createLegalDocumentVersion({
      id: `terms-of-service@${suffix}`,
      kind: "terms-of-service",
      version: suffix,
      effectiveAt: now,
      now,
    }),
    createLegalDocumentVersion({
      id: `platform-rules@${suffix}`,
      kind: "platform-rules",
      version: suffix,
      effectiveAt: now,
      now,
    }),
    createLegalDocumentVersion({
      id: `privacy-policy@${suffix}`,
      kind: "privacy-policy",
      version: suffix,
      effectiveAt: now,
      now,
    }),
  ];
}

test("defines the three required legal documents and their correct user actions", () => {
  assert.deepEqual(REQUIRED_LEGAL_DOCUMENT_KINDS, [
    "terms-of-service",
    "platform-rules",
    "privacy-policy",
  ]);
  assert.deepEqual(REQUIRED_ACKNOWLEDGEMENT_STATUS, {
    "terms-of-service": "accepted",
    "platform-rules": "accepted",
    "privacy-policy": "acknowledged",
  });
});

test("records immutable user, membership, organization, document version and evidence", () => {
  const { organization, user, membership } = fixture();
  const [terms] = versions();
  const record = createLegalAcknowledgement(user, membership, organization, terms, {
    id: "legal-ack-1",
    status: "accepted",
    now,
  });

  assert.equal(record.userId, user.id);
  assert.equal(record.membershipId, membership.id);
  assert.equal(record.organizationId, organization.id);
  assert.equal(record.documentVersionId, terms.id);
  assert.equal(record.documentKind, "terms-of-service");
  assert.equal(record.documentVersion, "1.0");
  assert.equal(record.status, "accepted");
  assert.deepEqual(record.evidence, {
    source: "explicit-user-action",
    capturedAt: now,
  });
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.evidence), true);
});

test("requires affirmative acceptance for Terms and Rules and acknowledgement for Privacy", () => {
  const { organization, user, membership } = fixture();
  const [terms, rules, privacy] = versions();

  assert.throws(
    () =>
      createLegalAcknowledgement(user, membership, organization, terms, {
        id: "bad-terms",
        status: "acknowledged",
        now,
      }),
    /requires status accepted/,
  );
  assert.throws(
    () =>
      createLegalAcknowledgement(user, membership, organization, rules, {
        id: "bad-rules",
        status: "acknowledged",
        now,
      }),
    /requires status accepted/,
  );
  assert.throws(
    () =>
      createLegalAcknowledgement(user, membership, organization, privacy, {
        id: "bad-privacy",
        status: "accepted",
        now,
      }),
    /requires status acknowledged/,
  );
});

test("legal gate remains pending until the exact current version of every document is recorded", () => {
  const { organization, user, membership } = fixture();
  const [terms, rules, privacy] = versions();
  const records = [
    createLegalAcknowledgement(user, membership, organization, terms, {
      id: "ack-terms",
      status: "accepted",
      now,
    }),
    createLegalAcknowledgement(user, membership, organization, privacy, {
      id: "ack-privacy",
      status: "acknowledged",
      now,
    }),
  ];

  const pending = resolveLegalAcknowledgementGate(
    user,
    membership,
    organization,
    [terms, rules, privacy],
    records,
  );
  assert.equal(pending.kind, "pending");
  assert.deepEqual(pending.pending, [
    {
      documentKind: "platform-rules",
      documentVersionId: rules.id,
      documentVersion: rules.version,
      requiredStatus: "accepted",
    },
  ]);

  const complete = resolveLegalAcknowledgementGate(
    user,
    membership,
    organization,
    [terms, rules, privacy],
    [
      ...records,
      createLegalAcknowledgement(user, membership, organization, rules, {
        id: "ack-rules",
        status: "accepted",
        now,
      }),
    ],
  );
  assert.equal(complete.kind, "complete");
  assert.deepEqual(complete.satisfied, REQUIRED_LEGAL_DOCUMENT_KINDS);
});

test("a newer required Terms version creates a fresh pending gate without invalidating history", () => {
  const { organization, user, membership } = fixture();
  const [termsV1, rulesV1, privacyV1] = versions("1.0");
  const records = [
    createLegalAcknowledgement(user, membership, organization, termsV1, {
      id: "ack-terms-v1",
      status: "accepted",
      now,
    }),
    createLegalAcknowledgement(user, membership, organization, rulesV1, {
      id: "ack-rules-v1",
      status: "accepted",
      now,
    }),
    createLegalAcknowledgement(user, membership, organization, privacyV1, {
      id: "ack-privacy-v1",
      status: "acknowledged",
      now,
    }),
  ];
  const termsV2 = createLegalDocumentVersion({
    id: "terms-of-service@2.0",
    kind: "terms-of-service",
    version: "2.0",
    effectiveAt: "2026-08-01T00:00:00.000Z",
    now,
  });

  assert.equal(
    resolveLegalAcknowledgementGate(
      user,
      membership,
      organization,
      [termsV1, rulesV1, privacyV1],
      records,
    ).kind,
    "complete",
  );

  const newGate = resolveLegalAcknowledgementGate(
    user,
    membership,
    organization,
    [termsV2, rulesV1, privacyV1],
    records,
  );
  assert.equal(newGate.kind, "pending");
  assert.deepEqual(newGate.pending, [
    {
      documentKind: "terms-of-service",
      documentVersionId: termsV2.id,
      documentVersion: termsV2.version,
      requiredStatus: "accepted",
    },
  ]);
  assert.equal(records[0].documentVersion, "1.0");
});

test("rejects inactive, cross-user and cross-tenant acknowledgement context", () => {
  const { organization, user, membership } = fixture();
  const [terms] = versions();
  const otherOrganization = createOrganizationAccount({ id: "org-beta", now });
  const otherUser = createUserIdentity({
    id: "user-two",
    name: "User Two",
    primaryEmail: "two@example.com",
    loginProvider: "example-idp",
    loginSubject: "subject-2",
    now,
  });
  const inactiveMembership = createOrganizationMembership(user, organization, {
    id: "membership-inactive",
    status: "inactive",
    now,
  });

  assert.throws(
    () =>
      createLegalAcknowledgement(user, inactiveMembership, organization, terms, {
        id: "inactive",
        status: "accepted",
        now,
      }),
    /Inactive organization membership/,
  );
  assert.throws(
    () =>
      createLegalAcknowledgement(otherUser, membership, organization, terms, {
        id: "wrong-user",
        status: "accepted",
        now,
      }),
    /different user identity/,
  );
  assert.throws(
    () =>
      createLegalAcknowledgement(user, membership, otherOrganization, terms, {
        id: "wrong-org",
        status: "accepted",
        now,
      }),
    /different organization tenant/,
  );
});

test("requires exactly one current version for each legal document kind", () => {
  const { organization, user, membership } = fixture();
  const [terms, rules, privacy] = versions();

  assert.throws(
    () => resolveLegalAcknowledgementGate(user, membership, organization, [terms, rules], []),
    /Exactly one current version/,
  );
  assert.throws(
    () =>
      resolveLegalAcknowledgementGate(
        user,
        membership,
        organization,
        [terms, rules, privacy, terms],
        [],
      ),
    /Exactly one current version/,
  );
});
