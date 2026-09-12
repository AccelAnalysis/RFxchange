import Link from "next/link";
import { applicationOrigins } from "../../application/platform/application-origins";
import { SMS_PROGRAM } from "../../content/sms";

export function SmsConsentDisclosure() {
  return <div>
    <p>{SMS_PROGRAM.disclosure}</p>
    <p>Read the <Link href={`${applicationOrigins.marketing}/terms`} target="_blank" rel="noreferrer">Terms of Service, including SMS terms</Link> and <Link href={`${applicationOrigins.marketing}/privacy`} target="_blank" rel="noreferrer">Privacy Policy</Link>.</p>
  </div>;
}
