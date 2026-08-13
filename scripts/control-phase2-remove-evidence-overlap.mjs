import fs from "node:fs";

const path = "governance/four-lens-workstreams.json";
const workstreams = JSON.parse(fs.readFileSync(path, "utf8"));
const packet = workstreams.workPackets.find((entry) => entry.id === "WP-RFX-42-ISS006-CORRECT-01");
if (!packet) throw new Error("Missing WP-RFX-42-ISS006-CORRECT-01");

const before = packet.ownedPaths;
if (!before.includes("test/**") || !before.includes("scripts/**")) {
  throw new Error("Expected broad ISS-006 test/scripts ownership was not present");
}

packet.ownedPaths = before.flatMap((entry) => {
  if (entry === "test/**") {
    return [
      "test/rfx42-iss006-*.test.mjs"
    ];
  }
  if (entry === "scripts/**") {
    return [
      "scripts/rfx42-iss006-*.mjs"
    ];
  }
  return [entry];
});

const phase2 = workstreams.workPackets.find((entry) => entry.id === "WP-EXCHANGE-ROOM-PHASE2-01");
if (!phase2) throw new Error("Missing WP-EXCHANGE-ROOM-PHASE2-01");

const overlap = packet.ownedPaths.filter((olderPath) => phase2.ownedPaths.includes(olderPath));
if (overlap.length) throw new Error(`Exact ownership overlap remains: ${overlap.join(", ")}`);

fs.writeFileSync(path, `${JSON.stringify(workstreams, null, 2)}\n`);
console.log(JSON.stringify({
  packet: packet.id,
  narrowedEvidencePaths: packet.ownedPaths.filter((entry) => entry.includes("iss006")),
  phase2EvidencePaths: phase2.ownedPaths.filter((entry) => entry.startsWith("test/") || entry.startsWith("scripts/"))
}, null, 2));
