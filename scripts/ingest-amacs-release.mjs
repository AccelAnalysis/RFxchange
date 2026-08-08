import path from "node:path";
import process from "node:process";

import {
  AMACS_HISTORICAL_RELEASE_PIN,
  AMACS_RELEASE_PIN,
  createGeneratedArtifacts,
  verifyAmacsRelease,
  writeGeneratedArtifacts,
} from "./amacs-release-tools.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const root = process.cwd();
const currentDirectory = path.resolve(argument(
  "--release-dir",
  path.join(root, "standards/amacs/releases/0.5.0"),
));
const historicalDirectory = path.resolve(argument(
  "--historical-release-dir",
  path.join(root, "standards/amacs/releases/0.1.0"),
));
const outputDirectory = path.resolve(argument(
  "--output-dir",
  path.join(root, "src/generated/amacs/0.5.0"),
));

const current = await verifyAmacsRelease(currentDirectory, AMACS_RELEASE_PIN);
const historical = await verifyAmacsRelease(
  historicalDirectory,
  AMACS_HISTORICAL_RELEASE_PIN,
);
const artifacts = createGeneratedArtifacts(current, historical);
await writeGeneratedArtifacts(outputDirectory, artifacts);

console.log(
  `Generated RFxchange AMACS ${current.manifest.version} projection from ${current.manifest.source_commit}.`,
);
