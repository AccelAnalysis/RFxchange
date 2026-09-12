import Link from "next/link";
import styles from "@/src/components/communications/ServiceSettings.module.css";
export const metadata = { title: "Email preferences updated", robots: { index: false, follow: false } };
export default function Page() {
  return <main className={styles.panel}><h1>You’re unsubscribed</h1><p>Optional RFxchange emails to this address have been stopped. A message already in delivery may still arrive. Essential account messages and your text choices are separate.</p><Link href="/account/communications">Manage preferences</Link></main>;
}
