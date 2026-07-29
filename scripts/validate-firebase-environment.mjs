import { readFile } from "node:fs/promises";

const firebaserc = JSON.parse(await readFile(new URL("../.firebaserc", import.meta.url), "utf8"));
const firebaseConfig = JSON.parse(await readFile(new URL("../firebase.json", import.meta.url), "utf8"));
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

const failures = [];

if (firebaserc.projects?.production !== "rfxchange") {
  failures.push(".firebaserc must map the production alias to Firebase project rfxchange.");
}

if (firebaserc.projects?.development === "rfxchange" || firebaserc.projects?.staging === "rfxchange") {
  failures.push("development or staging must never alias to the production Firebase project rfxchange.");
}

const expectedPorts = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199,
};

for (const [emulator, port] of Object.entries(expectedPorts)) {
  if (firebaseConfig.emulators?.[emulator]?.port !== port) {
    failures.push(`firebase.json must reserve ${emulator} emulator port ${port}.`);
  }
}

if (firebaseConfig.emulators?.ui?.enabled !== true || firebaseConfig.emulators?.ui?.port !== 4000) {
  failures.push("firebase.json must enable the Emulator UI on port 4000.");
}

if (firebaseConfig.emulators?.singleProjectMode !== true) {
  failures.push("firebase.json must enable emulator singleProjectMode.");
}

if (!envExample.includes("RFXCHANGE_ENV=development")) {
  failures.push(".env.example must declare the local default RFXCHANGE_ENV=development.");
}

for (const forbidden of ["PRIVATE_KEY=", "SERVICE_ACCOUNT=", "STRIPE_SECRET_KEY=", "MICROSOFT_CLIENT_SECRET="]) {
  if (envExample.split("\n").some((line) => line.trim().startsWith(forbidden))) {
    failures.push(`.env.example must not define privileged secret variable ${forbidden.slice(0, -1)}.`);
  }
}

if (failures.length > 0) {
  console.error("Firebase environment validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Firebase environment foundation validated.");
