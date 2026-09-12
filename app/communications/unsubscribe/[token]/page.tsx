import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/src/components/communications/ServiceSettings.module.css";
export const metadata = { title: "Unsubscribe from RFxchange email", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  return <main className={styles.panel}><h1>Unsubscribe from optional emails</h1><p>Confirm below to stop RFxchange marketing emails to the address that received this link. Text message preferences and essential account messages are separate.</p>
    <form method="post" action="/api/communications/unsubscribe"><input type="hidden" name="token" value={token}/><button>Unsubscribe</button></form>
    <p><Link href="/account/communications">Manage communication preferences</Link></p></main>;
}
