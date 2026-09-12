import { CURRENT_PLATFORM_POLICY_VERSION } from "../domain/legal/model";

export const PUBLIC_POLICY_VERSION = CURRENT_PLATFORM_POLICY_VERSION;
export const PUBLIC_POLICY_EFFECTIVE_DATE = "September 12, 2026";

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
    "These Terms are an agreement with Accel Analysis, LLC for RFxchange and its related platform services. They include user responsibilities, binding arbitration and a limitation of liability, subject to rights that cannot be waived by law.",
  sections: Object.freeze([
    {
      heading: "1. Acceptance and organizational use",
      paragraphs: Object.freeze([
        "By expressly accepting these Terms, you agree to them for your use of RFxchange. RFxchange is a service of Accel Analysis, LLC (Company, we or us). These Terms cover RFxchange and related Company services that expressly incorporate them; they do not automatically amend separate contracts for unrelated businesses. The Company, its participating affiliates and related business entities, and their officers, members, employees, agents and service providers are the Protected Parties for the activities covered by these Terms. If you act for an organization, you also represent that you are authorized to provide the information and take the actions you submit on that organization’s behalf.",
        "RFxchange is organization-centered. Individual user identities operate through organization memberships and permissions; a user’s title, relationship description, or profile text does not by itself grant organizational authority.",
      ]),
    },
    {
      heading: "2. Account eligibility and security",
      bullets: Object.freeze([
        "Provide accurate account and contact information and keep it current.",
        "Protect credentials, verification links, sessions, and administrative access. You are responsible for actions you authorize and for reasonable precautions against misuse of your account; this does not transfer our non-waivable security duties to you.",
        "Do not share accounts in a way that defeats individual attribution or organizational permissions.",
        "Notify RFxchange through the published support channel if you believe an account or organization has been compromised.",
      ]),
    },
    {
      heading: "3. Organization information and authority",
      paragraphs: Object.freeze([
        "You are responsible for the accuracy, lawfulness, permissions and rights associated with organization identity, locations, capabilities, certifications, opportunities, responses, referrals, outcomes and other information you submit. Obtain permission before supplying another person’s information, respect visibility choices and maintain independent copies of records you need. Claiming or creating an organization record does not automatically make the organization Verified or endorse its claims. You must independently evaluate counterparties, procurement requirements, deadlines, contracts, professional advice and business decisions. A badge, classification, map position, match, referral, payment or membership is not a guarantee of fitness, credibility or outcome.",
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
        "To the maximum extent permitted by law, the services are provided as is and as available. The Protected Parties disclaim implied warranties of merchantability, fitness for a particular purpose, title and non-infringement. They do not guarantee uninterrupted or error-free operation, message delivery, data completeness, qualification, awards, contracts, revenue or another business outcome. Nothing here excludes a warranty that applicable law prohibits excluding.",
      ]),
    },
    {
      heading: "12. Separate agreements and contact",
      paragraphs: Object.freeze([
        "If a separate written agreement with RFxchange expressly conflicts with these Terms, that written agreement controls for the conflicting subject matter. Otherwise these Terms constitute the governing platform-use agreement together with incorporated policies and feature-specific terms presented to you.",
        "Send support questions, legal notices and requests to Accel Analysis, LLC at jholman@accelanalysis.com. Identify the affected service and account and describe the request without sending passwords, API keys or sensitive payment information.",
      ]),
    },
    {
      heading: "13. SMS and email communications",
      paragraphs: Object.freeze([
        "RFxchange offers optional recurring automated marketing messages for organization setup reminders, community updates and invitations to return. SMS requires a separate affirmative choice for the verified phone number on your account. Email choices, acknowledgement of the Privacy Policy and acceptance of these Terms do not themselves subscribe you to marketing texts. Consent is not a condition of purchase or use of RFxchange.",
        "Marketing message frequency varies, up to one message per day, ordinarily between 9 AM and 8 PM in your selected time zone. Message and data rates may apply. Reply STOP to unsubscribe or turn off Text messages in Communication preferences and save. A messaging provider may send a single opt-out confirmation. For help, email jholman@accelanalysis.com. Update your account promptly if your number changes or you no longer control it. Re-enabling delivery after STOP does not itself supply or renew RFxchange consent.",
        "Carriers and service providers affect availability and delivery. Messages may be delayed, filtered, duplicated or undelivered. SMS is not an emergency service or a substitute for checking time-sensitive business records in the platform. Separate security or essential service communications may be necessary to provide requested services; they do not authorize unrelated marketing."
]),
    },
    {
      heading: "14. Public data, assistance and third-party services",
      paragraphs: Object.freeze([
        "Organization enrichment may consult public sources such as SAM.gov and USAspending and present source-attributed suggestions. Public records can be incomplete, outdated or associated with the wrong entity. You must review proposed changes before accepting them. RFxchange does not provide a government endorsement or replace the source of record.",
        "Where offered, automated interpretation, classification, matching, maps, analytics and curated help provide assistance rather than professional advice or an autonomous business decision. Validate outputs before relying on them. Help answers do not replace agreements or disclose private account information. Third-party links and services remain subject to their own terms and practices.",
        "Available paid services disclose price, recurring billing, cancellation, referral or promotional terms before purchase. You authorize only charges to which you agree. Payment processing may be provided by Stripe. Paid recognition, advertisements or sponsorship do not establish substantive qualification or guarantee a market outcome."
]),
    },
    {
      heading: "15. Responsibility for third-party claims",
      paragraphs: Object.freeze([
        "To the extent permitted by law, you will indemnify and hold the Protected Parties harmless from third-party claims, reasonable damages and reasonable legal costs to the extent caused by your unlawful conduct, material breach of these Terms, infringement through content you supply, or actions you take without authority. This obligation does not cover a Protected Party’s own negligence, fraud, willful misconduct or violation of a duty that cannot lawfully be shifted to you.",
        "The Company will give reasonably prompt notice of an indemnified claim and reasonable cooperation. You may not settle a claim in a manner that admits fault by, imposes non-monetary obligations on, or fails to release a Protected Party without that party’s written consent."
]),
    },
    {
      heading: "16. Limitation of liability",
      paragraphs: Object.freeze([
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE PROTECTED PARTIES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR LOST PROFITS, REVENUE, BUSINESS OPPORTUNITIES, GOODWILL OR DATA, ARISING FROM THE COVERED SERVICES, EVEN IF ADVISED OF THE POSSIBILITY.",
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL AGGREGATE LIABILITY OF ALL PROTECTED PARTIES FOR ALL CLAIMS ARISING FROM OR RELATING TO THE AFFECTED SERVICE WILL NOT EXCEED THE TOTAL FEES ACTUALLY PAID BY YOU OR YOUR ORGANIZATION TO THE COMPANY FOR THAT SERVICE BEFORE THE EVENT GIVING RISE TO THE CLAIM. AMOUNTS PAID TO OTHER PARTICIPANTS, CARRIERS OR UNRELATED THIRD PARTIES ARE EXCLUDED. FOR A SERVICE PROVIDED WITHOUT PAYMENT, THIS CONTRACTUAL CAP IS ZERO ONLY TO THE EXTENT LAWFUL. MULTIPLE CLAIMS OR PROTECTED PARTIES DO NOT INCREASE THE CAP.",
        "These exclusions and limits apply regardless of legal theory, but do not exclude or limit fraud, willful misconduct, gross negligence, liability for injury where it cannot be excluded, non-waivable privacy or consumer rights, or any other liability, remedy or obligation that applicable law prohibits excluding or limiting. If a limit is unenforceable, it applies only to the extent permitted by law."
]),
    },
    {
      heading: "17. Dispute notice and binding arbitration",
      paragraphs: Object.freeze([
        "Before beginning arbitration or a court proceeding, you and the Company will first attempt in good faith to resolve a dispute through written notice and 30 days of discussion. Send your notice to jholman@accelanalysis.com with your name, contact information, affected service, facts and requested resolution. The Company will use the contact information on your account. This process does not prevent a timely protective filing to preserve a legal deadline.",
        "If unresolved, disputes arising out of or relating to these Terms or the covered services will be resolved by final, binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. If the AAA determines its Consumer Arbitration Rules apply, those rules and their consumer protections control. The Federal Arbitration Act governs this arbitration agreement. The parties agree to arbitrate covered disputes before pursuing their merits in court; for those disputes arbitration replaces a court or jury trial, subject to the exceptions below.",
        "There will be one neutral arbitrator. Hearings may be remote by agreement or as allowed by the applicable rules. An in-person hearing location will be chosen under those rules, including applicable consumer accessibility requirements. Fees and costs follow the applicable AAA rules and law, and the Company will pay any amounts it is required to pay. The arbitrator may award remedies available under applicable law. A court of competent jurisdiction may enter judgment on the award.",
        "Either party may bring an eligible individual claim in small-claims court, seek temporary court relief needed to protect rights while arbitration is pending, or ask a court to enforce or review an award as permitted by law. This provision does not restrict complaints to government agencies, regulatory proceedings, disputes that law makes non-arbitrable, or statutory rights to elect court proceedings. Courts decide enforceability or formation of this arbitration agreement where required by law.",
        "Rules and filing information are available from the American Arbitration Association at https://www.adr.org. If the AAA declines or cannot administer, the parties may agree on another neutral administrator; otherwise applicable law determines the available forum. Virginia law governs these Terms to the extent not displaced by federal law or mandatory protections of another jurisdiction. An unenforceable provision is severed only to the extent permitted by law."
]),
    },
    {
      heading: "18. Changes and continuing effect",
      paragraphs: Object.freeze([
        "This version takes effect for you when you expressly accept it. New arbitration provisions are not imposed retroactively merely by posting them. Earlier acceptance records remain records of the earlier version. Material changes are presented for renewed acceptance when required. SMS consent remains separate and can be withdrawn at any time.",
        "Provisions that by their nature must continue, including payment obligations already incurred, content rights needed for retained records, indemnification, limitations of liability and dispute resolution, survive termination to the extent permitted by law. The Privacy Policy explains data handling and does not waive statutory duties or create consent for unrelated uses."
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
    "Accel Analysis, LLC operates RFxchange. This notice describes information used across our public Marketing website, participant Exchange, authorized Administration, communications and related services that link to this notice. It explains your choices and responsibilities and preserves rights and duties that applicable law does not allow anyone to waive.",
  sections: Object.freeze([
    {
      heading: "1. Information we collect",
      bullets: Object.freeze([
        "Account information such as name, email address, verified phone number when available, authentication identifiers, account-security status, organization memberships and versioned policy acknowledgements.",
        "Organization information such as business identity, website, contacts, capabilities, roles, objectives, locations, service geographies, authority evidence, and profile information.",
        "Network activity such as opportunities, RFx activity, responses, referrals, teaming activity, resource interactions, workflow state, notifications, administrative actions, and outcome records as features become available.",
        "Technical and security information such as session metadata, timestamps, audit events, device or request information, error information, language preferences and security signals needed to operate and protect the platform. Campaign references may be retained in a first-party cookie to preserve acquisition context; essential cookies support sessions and preferences.",
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
        "With other participants when you publish, share, respond, refer, team, communicate, or otherwise use a workflow designed to disclose that information. This does not authorize disclosure of mobile opt-in data or consent for another party’s marketing.",
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
        "Contact Accel Analysis, LLC at jholman@accelanalysis.com for access, correction, deletion, a copy of your information, applicable opt-out rights or an appeal of our response. We may verify identity and authority and will respond within the period required by applicable law. You do not need to create a new account to contact us. State the affected service and request without sending credentials. Applicable rights, exceptions and appeal or regulatory complaint options depend on your jurisdiction and our legal obligations.",
      ]),
    },
    {
      heading: "10. SMS, email and communication choices",
      paragraphs: Object.freeze([
        "We process your communication choices, verified contact details, time zone, consent wording/version and timestamps, delivery status, provider references and opt-out or suppression events. These records help deliver requested messages, honor withdrawals, enforce frequency and time preferences, investigate failures and demonstrate consent. Our messaging provider may process message text and phone numbers to perform those tasks.",
        "No mobile information will be sold or shared with third parties for promotional or marketing purposes. Mobile opt-in data and consent are excluded from sharing for third-party marketing, including with affiliates. The limited sharing necessary with carriers and providers to deliver messages, honor opt-outs, prevent abuse or satisfy law is not permission for their own advertising.",
        "Optional RFxchange marketing SMS requires a separate, unchecked-by-default affirmative choice and saving that choice. Agreeing to platform terms, acknowledging this notice, creating an account or providing a telephone number is not SMS marketing consent. Consent is not a condition of purchase or access to RFxchange. Email and text choices are separate. We do not convert a public business listing into permission to text its contacts.",
        "Message frequency varies, up to one marketing message per day. Message and data rates may apply. Reply STOP to unsubscribe or disable Text messages in Communication preferences and save. For help, email jholman@accelanalysis.com. We may retain the minimum suppression and consent history necessary to honor your choice and legal obligations after you unsubscribe. A provider may send a single opt-out confirmation."
]),
    },
    {
      heading: "11. Enrichment, help, payments and service providers",
      paragraphs: Object.freeze([
        "When enrichment is requested, we may send an organization identifier such as its Unique Entity ID to sources including SAM.gov and USAspending and retain relevant public results, source references, retrieval times, suggested changes and review decisions. Public enrichment does not automatically replace organization-controlled information. Report inaccurate associations through your organization or support.",
        "Public help matches a question against curated answers. Treat help requests as ordinary service interactions and avoid entering passwords, payment details or private business records. Automated assistance, where available, remains subject to human review; this policy does not claim that an unavailable feature is processing your information.",
        "Providers may include Google/Firebase for hosting, authentication, databases and storage; Microsoft for transactional email; Telnyx and carriers for messaging; mapping/geocoding providers for geographic services; and Stripe for payment processing when paid features are used. Information supplied is limited to the service purpose. We retain payment references and commercial state where needed rather than full payment-card credentials. Their handling of information directly provided to them is also governed by their notices.",
        "Data may be processed in the United States and other locations where our service providers operate, subject to required transfer protections. We limit authorized administrative access to support, security, moderation, enrichment review, billing and other legitimate operating needs and retain appropriate action history."
]),
    },
    {
      heading: "12. Your responsibilities and non-waivable protections",
      paragraphs: Object.freeze([
        "Provide accurate information, use only accounts and organization permissions you are authorized to use, obtain permission before submitting another person’s information, choose publication settings carefully and protect your credentials and devices. Keep your phone number and email current. Publicly shared information may be copied by others beyond our control; do not publish sensitive material in public profiles or help requests.",
        "These responsibilities do not shift our own statutory privacy or security obligations to you. Nothing in this Privacy Policy waives rights, duties, remedies or regulator authority that cannot legally be waived. The Terms of Service separately address service risks, user responsibility, lawful limitations on liability and dispute resolution; acknowledging this notice alone does not accept arbitration or marketing."
]),
    },
  ]),
});
