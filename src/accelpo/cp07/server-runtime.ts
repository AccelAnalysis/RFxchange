import {
  ACCELPO_COMMAND_REGISTRY,
  AccelPoCommandRegistry,
} from "../../application/accelpo/command-port.ts";
import {
  CP07_FILE_EVIDENCE_COMMAND_DEFINITIONS,
} from "../../../apps/accelpo/src/file-evidence/commands.ts";

/**
 * Composes CP-07 into the single CP-03 registry without mutating global module state. Existing
 * command definitions remain authoritative; duplicate names fail closed instead of silently
 * replacing another part's command contract.
 */
export function createCP07ServerCommandRegistry(): AccelPoCommandRegistry {
  const registry = new AccelPoCommandRegistry(ACCELPO_COMMAND_REGISTRY.list());
  for (const definition of CP07_FILE_EVIDENCE_COMMAND_DEFINITIONS) {
    if (registry.get(definition.name)) {
      throw new Error(`CP-07 command conflicts with an existing command: ${definition.name}`);
    }
    registry.register(definition);
  }
  return registry;
}
