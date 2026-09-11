import { redirect } from "next/navigation";
import { applicationOrigins } from "@/src/application/platform/application-origins";

export default function PublicEntry() { redirect(applicationOrigins.marketing); }
