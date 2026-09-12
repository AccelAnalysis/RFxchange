import { createHash } from "node:crypto";

/** A lookup key for suppression; not an anonymization or authorization boundary. */
export const communicationAddressKey = (channel: string, address: string) =>
  createHash("sha256").update(`${channel}:${address.trim().toLowerCase()}`).digest("hex");
