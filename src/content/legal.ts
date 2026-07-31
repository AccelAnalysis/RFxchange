export const PUBLIC_POLICY_VERSION = "2026.07.31";
export const PUBLIC_POLICY_EFFECTIVE_DATE = "July 31, 2026";

export interface PublicPolicySection {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly bullets?: readonly string[];
}

export interface PublicPolicyDocument {
  readonly title: string;
  readonly shortTitle: string;
  readonly version: string;
  readonly effectiveDate: string;
  readonly summary: string;
  readonly sections: readonly PublicPolicySection[];
}

export const termsOfService: PublicPolicyDocument = Object.freeze({
  title: "RFxchange Terms of Service",
  shortTitle: "Terms of Service",
  version: PUBLIC_POLICY_VERSION,
  effectiveDate: PUBLIC_POLICY_EFFECTIVE_DATE,
  summary:
    "These Terms govern use of the RFxchange business network, including organization accounts, profiles, opportunities, referrals, teaming, resources, and related platform services.",
  sections: Object.freeze([
    {
      heading: "1. Acceptance and organizational use",
      paragraphs: Object.freeze([
        "By creating or using an RFxchange account, you agree to these Terms for your own use of the platform. If you act for an organization, you also represent that you are authorized to provide the information and take the actions you submit on that organization’s behalf.",
        "RFxchange is organization-centered. Individual user identities operate through organization memberships and permissions; a user’s title, relationship description, or profile text does not by itself grant organizational authority.",
      ]),
    },
    {
      heading: "2. Account eligibility and security",
      bullets: Object.freeze([
        "Provide accurate account and contact information and keep it current.",
        "Protect credentials, verification links, sessions, and administrative access.",
        "Do not share accounts in a way that defeats individual attribution or organizational permissions.",
        "Notify RFxchange through the published support channel if you believe an account or organization has been compromised.",
      ]),
    },
    {
      heading: "3. Organization information and authority",
      paragraphs: Object.freeze([
        "You are responsible for the accuracy of organization identity, locations, capabilities, certifications, opportunities, responses, referrals, outcomes, and other information you submit. Claiming or creating an organization record does not automatically make the organization Verified or endorse its claims.",
        "RFxchange may require additional evidence, review, re-verification, or administrative approval before allowing sensitive organization actions or displaying trust indicators.",
      ]),
    },
    {
      heading: "4. Opportunities, RFx activity, referrals, and teaming",
      paragraphs: Object.freeze([
        "RFxchange provides infrastructure for discovery, communication, structured requests, responses, referrals, teaming, and related business activity. Participants remain responsible for their own diligence, decisions, contracts, pricing, performance, compliance, and professional advice.",
        "Unless RFxchange expressly states otherwise for a specific transaction, RFxchange is not a party to agreements between participants and does not guarantee an award, referral conversion, contract, financing decision, provider outcome, or other business result.",
      ]),
    },
    {
      heading: "5. Platform Rules",
      paragraphs: Object.freeze([
        "The RFxchange Platform Rules are incorporated into these Terms. You must use the network legitimately, accurately, respectfully, and without manipulating platform processes, credibility, referrals, evaluations, or access controls.",
      ]),
    },
    {
      heading: "6. Content and platform license",
      paragraphs: Object.freeze([
        "You retain ownership of content you submit, subject to rights you may have granted to others. You grant RFxchange the limited rights reasonably necessary to host, process, reproduce, display, transmit, index, match, analyze, and otherwise operate that content according to your visibility settings, platform workflows, and these Terms.",
        "Do not submit content you do not have the right to use or disclose, including protected confidential information, personal information, trade secrets, or copyrighted material outside the permissions that apply to you.",
      ]),
    },
    {
      heading: "7. Privacy and data handling",
      paragraphs: Object.freeze([
        "RFxchange handles account, organization, location, activity, and related data as described in the Privacy Policy. Public, participant-visible, restricted, and private information may be treated differently based on the feature and visibility choice involved.",
      ]),
    },
    {
      heading: "8. Fees and third-party services",
      paragraphs: Object.freeze([
        "Some current or future features may involve paid plans, transaction fees, credits, payment processors, mapping services, communications providers, or other third-party services. Applicable commercial terms will be presented before a charge or paid commitment is created. Third-party services may also be governed by their own terms.",
      ]),
    },
    {
      heading: "9. Availability, changes, and platform authority",
      paragraphs: Object.freeze([
        "RFxchange may add, modify, suspend, restrict, or retire features, workflows, integrations, eligibility rules, or geography availability. Emergency, security, legal, integrity, or operational conditions may require immediate intervention.",
        "Material changes to these Terms may require renewed acceptance before continued use of affected services. Historical acceptance records may be retained as audit evidence.",
      ]),
    },
    {
      heading: "10. Suspension and termination",
      paragraphs: Object.freeze([
        "RFxchange may restrict, suspend, or terminate access when reasonably necessary to address security risk, fraud, unlawful use, material policy violations, platform manipulation, nonpayment of applicable charges, or protection of participants and platform integrity. Restrictions may apply to a user, organization, feature, action, or geography rather than the entire account where appropriate.",
      ]),
    },
    {
      heading: "11. Disclaimers",
      paragraphs: Object.freeze([
        "RFxchange is provided on an as-available basis. Business information, participant claims, opportunity details, resource information, and third-party data may contain errors or change over time. Participants should independently verify information that matters to a business, legal, financial, procurement, compliance, or contracting decision.",
      ]),
    },
    {
      heading: "12. Governing terms and contact",
      paragraphs: Object.freeze([
        "If a separate written agreement with RFxchange expressly conflicts with these Terms, that written agreement controls for the conflicting subject matter. Otherwise these Terms constitute the governing platform-use agreement together with incorporated policies and feature-specific terms presented to you.",
        "Questions about these Terms may be submitted through the support or contact channel published by RFxchange.",
      ]),
    },
  ]),
});

export const platformRules: PublicPolicyDocument = Object.freeze({
  title: "RFxchange Platform Rules",
  shortTitle: "Platform Rules",
  version: PUBLIC_POLICY_VERSION,
  effectiveDate: PUBLIC_POLICY_EFFECTIVE_DATE,
  summary:
    "These rules protect legitimate business participation, accurate organizational representation, process integrity, and respectful use of the Exchange.",
  sections: Object.freeze([
    {
      heading: "1. Represent organizations and authority accurately",
      bullets: Object.freeze([
        "Do not impersonate an organization, user, official, buyer, provider, partner, or administrator.",
        "Do not claim ownership, employment, authorization, certification, verification, past performance, or capabilities you cannot substantiate.",
        "Use organization memberships and permissions rather than shared or misleading user identities.",
      ]),
    },
    {
      heading: "2. Keep business information truthful",
      bullets: Object.freeze([
        "Describe capabilities, locations, service areas, availability, qualifications, pricing, opportunities, responses, and outcomes accurately.",
        "Correct material information when you learn it is inaccurate or no longer current.",
        "Do not create duplicate or fabricated organizations, opportunities, referrals, responses, transactions, or outcomes to influence discovery or credibility.",
      ]),
    },
    {
      heading: "3. Protect process integrity",
      bullets: Object.freeze([
        "Do not manipulate RFx evaluations, referrals, teaming invitations, endorsements, reviews, badges, rankings, or other trust signals.",
        "Do not coordinate false activity, self-dealing activity, reciprocal manipulation, or manufactured engagement intended to mislead other participants.",
        "Do not bypass access controls, geographic restrictions, organization permissions, administrative decisions, or protected workflows.",
      ]),
    },
    {
      heading: "4. Respect participants and the network",
      bullets: Object.freeze([
        "Do not harass, threaten, discriminate against, defraud, deceive, or exploit other participants.",
        "Do not send spam, deceptive solicitation, malware, credential-harvesting requests, or irrelevant mass outreach.",
        "Use contact information obtained through RFxchange for legitimate business purposes consistent with the context in which it was provided.",
      ]),
    },
    {
      heading: "5. Protect confidential and restricted information",
      bullets: Object.freeze([
        "Do not disclose information marked confidential, private, restricted, or otherwise protected unless you have authority to do so.",
        "Do not use another participant’s nonpublic information outside the business process for which access was provided.",
        "Do not upload regulated, restricted, export-controlled, classified, or highly sensitive information unless the applicable RFxchange feature expressly supports that data class.",
      ]),
    },
    {
      heading: "6. Comply with law and applicable procurement rules",
      paragraphs: Object.freeze([
        "Participants are responsible for laws, regulations, procurement requirements, professional obligations, licensing requirements, sanctions, export controls, privacy duties, and contractual restrictions that apply to their activity.",
      ]),
    },
    {
      heading: "7. Enforcement",
      paragraphs: Object.freeze([
        "RFxchange may investigate reported or detected misuse and may remove content, pause an action, limit a capability, require evidence, restrict an account or organization, revoke administrative authority, or suspend access where necessary to protect participants and platform integrity. Enforcement may be scoped and audited rather than applied broadly when a narrower response is appropriate.",
      ]),
    },
  ]),
});

export const privacyPolicy: PublicPolicyDocument = Object.freeze({
  title: "RFxchange Privacy Policy",
  shortTitle: "Privacy Policy",
  version: PUBLIC_POLICY_VERSION,
  effectiveDate: PUBLIC_POLICY_EFFECTIVE_DATE,
  summary:
    "This policy explains how RFxchange handles user, organization, location, activity, communications, and related information used to operate the business network.",
  sections: Object.freeze([
    {
      heading: "1. Information we collect",
      bullets: Object.freeze([
        "Account information such as name, email address, authentication identifiers, account-security status, and organization memberships.",
        "Organization information such as business identity, website, contacts, capabilities, roles, objectives, locations, service geographies, authority evidence, and profile information.",
        "Network activity such as opportunities, RFx activity, responses, referrals, teaming activity, resource interactions, workflow state, notifications, administrative actions, and outcome records as features become available.",
        "Technical and security information such as session metadata, timestamps, audit events, device or request information, error information, and security signals needed to operate and protect the platform.",
        "Commercial information when paid features are used, including platform commercial state and provider references. Payment-card details may be handled directly by the applicable payment provider rather than stored by RFxchange.",
      ]),
    },
    {
      heading: "2. How we use information",
      bullets: Object.freeze([
        "Authenticate users and enforce organization permissions, lifecycle gates, geography rules, and account security.",
        "Create and display organization profiles, map presence, discovery results, opportunities, referrals, resources, teaming, and related workflows according to applicable visibility settings.",
        "Operate communications, notifications, support, moderation, audit, fraud prevention, security, and administrative review.",
        "Improve matching, discovery, platform reliability, product design, analytics, and network intelligence using data appropriate to those purposes.",
        "Comply with legal obligations and enforce platform agreements and policies.",
      ]),
    },
    {
      heading: "3. Public, participant-visible, and private information",
      paragraphs: Object.freeze([
        "RFxchange distinguishes information intended for public discovery from participant-visible, organization-restricted, administrative, and private information. Location privacy controls may publish an exact location, an approximate representation, or locality-only presence while retaining the confirmed private location needed for platform integrity.",
        "A public organization profile or marker does not make all underlying account, contact, authority, evidence, or location records public.",
      ]),
    },
    {
      heading: "4. How information may be shared",
      bullets: Object.freeze([
        "With other participants when you publish, share, respond, refer, team, communicate, or otherwise use a workflow designed to disclose that information.",
        "With service providers that process data for hosting, authentication, mapping/geocoding, communications, payments, security, analytics, support, or other platform operations subject to appropriate service relationships.",
        "When reasonably necessary to protect RFxchange, participants, the public, or platform security; investigate misuse; enforce agreements; or comply with valid legal process.",
        "As part of a business reorganization, financing, merger, acquisition, or transfer where lawful and subject to appropriate handling of the information involved.",
      ]),
    },
    {
      heading: "5. Data quality, controls, and account administration",
      paragraphs: Object.freeze([
        "Users and organization administrators can update information made editable through the platform. Some records—including audit, security, legal-acceptance, authority, transaction, or compliance records—may be retained as immutable or controlled history rather than editable profile content.",
        "Organization administrators may manage organization memberships and permissions within the authority granted to them. Platform administrators may access limited information when authorized for support, security, claims, moderation, audit, or other governed administrative purposes.",
      ]),
    },
    {
      heading: "6. Retention",
      paragraphs: Object.freeze([
        "RFxchange retains information for as long as reasonably necessary for the purpose for which it was collected, active platform operation, security, auditability, dispute resolution, contractual obligations, legal requirements, and legitimate record-preservation needs. Retention may differ by data class and does not mean every record is kept indefinitely.",
      ]),
    },
    {
      heading: "7. Security",
      paragraphs: Object.freeze([
        "RFxchange uses account authentication, server-side authorization, scoped permissions, session controls, audit records, provider security controls, and other safeguards appropriate to the platform architecture. No online service can guarantee absolute security, and participants are responsible for protecting their credentials and devices.",
      ]),
    },
    {
      heading: "8. Children",
      paragraphs: Object.freeze([
        "RFxchange is a business network and is not intended for use by children. Individuals creating accounts must be legally capable of entering the applicable platform agreement and acting in the represented business context.",
      ]),
    },
    {
      heading: "9. Policy changes and questions",
      paragraphs: Object.freeze([
        "RFxchange may update this Privacy Policy as the platform, law, data uses, or service providers change. Material changes may be presented through renewed acknowledgement or additional permission requests where appropriate. Historical versions and acknowledgement evidence may be retained.",
        "Privacy questions or requests may be submitted through the support or contact channel published by RFxchange. Additional jurisdiction-specific rights or notices will be provided when applicable to the user, organization, feature, or processing activity involved.",
      ]),
    },
  ]),
});
