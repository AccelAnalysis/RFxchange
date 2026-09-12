import type { Metadata } from "next";
import Link from "next/link";
import { BrandWordmark } from "@/src/components/brand/BrandWordmark";
import { SmsConsentDisclosure } from "@/src/components/communications/SmsConsentDisclosure";
import { SMS_PROGRAM } from "@/src/content/sms";
import { applicationOrigins } from "@/src/application/platform/application-origins";
import styles from "@/src/components/legal/PublicPolicyPage.module.css";

export const metadata: Metadata = { title: "SMS updates and consent", description: "How RFxchange users choose optional text messages, manage consent and unsubscribe." };

export default function SmsWorkflowPage() {
  return <main className={styles.page}>
    <header className={styles.header}><BrandWordmark /><Link href="/">Home</Link></header>
    <article className={styles.document}>
      <p className={styles.eyebrow}>By Accel Analysis, LLC</p>
      <h1>Choose your text updates</h1>
      <p className={styles.summary}>RFxchange offers optional organization setup reminders, business community updates and invitations to return. Messages come from +1 833-739-1819. You choose whether to receive them.</p>
      <div className={styles.sections}>
        <section><h2>How to subscribe</h2>
          <ol>
            <li>Sign in and open Communication preferences using the link below.</li>
            <li>Read the SMS consent and policies. Select the optional updates consent and Text messages checkboxes. Both are unchecked for new users.</li>
            <li>Select your time zone and choose Save preferences. SMS consent is recorded only when you save your choices.</li>
          </ol>
          <p>Text messages require a verified phone number on your account. If Text messages is unavailable, contact <a href={`mailto:${SMS_PROGRAM.supportEmail}`}>{SMS_PROGRAM.supportEmail}</a> for help. Opening this page or signing up for RFxchange does not subscribe you to texts.</p>
          <p><Link href={`${applicationOrigins.exchange}/account/communications`}>Open Communication preferences</Link></p>
        </section>
        <section><h2>The SMS consent you will see</h2>
          <p>The Text messages checkbox in your account presents this wording:</p>
          <blockquote>{SMS_PROGRAM.consent}</blockquote>
          <SmsConsentDisclosure />
        </section>
        <section><h2>Change your mind at any time</h2>
          <p>Reply STOP to a message to unsubscribe, or clear Text messages in Communication preferences and save. A carrier or messaging provider may send a single opt-out confirmation. Re-enabling delivery after STOP does not replace your saved RFxchange consent.</p>
          <p>Optional marketing messages are sent between 9 AM and 8 PM in your chosen time zone, at most once a day. Subscription does not guarantee delivery. Service availability and carrier approval affect when messages begin.</p>
        </section>
        <section><h2>Your mobile information</h2>
          <p>No mobile information will be sold or shared with third parties for promotional or marketing purposes. Mobile opt-in data and consent are not shared with third parties for their own marketing. Service providers and carriers may process the minimum information needed to deliver messages, honor opt-outs, prevent abuse and meet legal obligations.</p>
          <p>RFxchange is operated by Accel Analysis, LLC. Questions: <a href={`mailto:${SMS_PROGRAM.supportEmail}`}>{SMS_PROGRAM.supportEmail}</a>.</p>
        </section>
      </div>
    </article>
    <footer className={styles.footer}><BrandWordmark compact /><nav aria-label="Legal links"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></nav></footer>
  </main>;
}
