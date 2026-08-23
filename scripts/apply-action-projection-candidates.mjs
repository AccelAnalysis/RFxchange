import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(path, before, after) {
  const source = readFileSync(path, "utf8");
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${path}: expected one exact match, found ${count}`);
  writeFileSync(path, source.replace(before, after), "utf8");
}

replaceOnce(
  "src/application/organizations/capabilities-exchange.ts",
  `    let resolvedHandler: ExchangeRoomActionProjection["resolvedHandler"] = null;\n\n    if (own && definition.id === "capabilities.manage-view") {\n      operational = true;\n      authorized = input.canManageProfile;\n      resolvedHandler = authorized ? Object.freeze({ kind: "href", href: "/organization-profile#market-profile-title" }) : null;\n    } else if (own && definition.id === "capabilities.classify-match") {\n      operational = true;\n      authorized = input.canManageProfile;\n      resolvedHandler = authorized ? Object.freeze({ kind: "href", href: "/organization-profile#describe-capability-title" }) : null;\n    } else if (own && definition.id === "capabilities.gaps-save") {\n      operational = true;\n      resolvedHandler = Object.freeze({\n        kind: "href",\n        href: \`/capabilities?view=gaps&selectedOrganization=\${encodeURIComponent(input.organizationId)}\`,\n      });\n    } else if (!own && definition.id === "capabilities.manage-view") {\n      operational = true;\n      resolvedHandler = Object.freeze({\n        kind: "href",\n        href: \`/capabilities?selectedOrganization=\${encodeURIComponent(input.organizationId)}\`,\n      });\n    }`,
  `    let handlerCandidate: ExchangeRoomActionProjection["handlerCandidate"] = null;\n    let resolvedHandler: ExchangeRoomActionProjection["resolvedHandler"] = null;\n\n    if (own && definition.id === "capabilities.manage-view") {\n      operational = true;\n      authorized = input.canManageProfile;\n      handlerCandidate = Object.freeze({ kind: "href", href: "/organization-profile#market-profile-title" });\n      resolvedHandler = authorized ? handlerCandidate : null;\n    } else if (own && definition.id === "capabilities.classify-match") {\n      operational = true;\n      authorized = input.canManageProfile;\n      handlerCandidate = Object.freeze({ kind: "href", href: "/organization-profile#describe-capability-title" });\n      resolvedHandler = authorized ? handlerCandidate : null;\n    } else if (own && definition.id === "capabilities.gaps-save") {\n      operational = true;\n      handlerCandidate = Object.freeze({\n        kind: "href",\n        href: \`/capabilities?view=gaps&selectedOrganization=\${encodeURIComponent(input.organizationId)}\`,\n      });\n      resolvedHandler = handlerCandidate;\n    } else if (!own && definition.id === "capabilities.manage-view") {\n      operational = true;\n      handlerCandidate = Object.freeze({\n        kind: "href",\n        href: \`/capabilities?selectedOrganization=\${encodeURIComponent(input.organizationId)}\`,\n      });\n      resolvedHandler = handlerCandidate;\n    }`,
);
replaceOnce(
  "src/application/organizations/capabilities-exchange.ts",
  `      disabledReason,\n      resolvedHandler,`,
  `      disabledReason,\n      handlerCandidate,\n      resolvedHandler,`,
);

replaceOnce(
  "src/application/resource-network/mobile-resource-exchange.ts",
  `  const reason: ExchangeRoomActionDisabledReason | null = !operational ? "not-operational" : !applicable ? "not-applicable" : !authorized ? "not-authorized" : href ? null : "not-operational";\n  return Object.freeze({ ...definition, labelKey: variant === "own" ? definition.labelKey : definition.externalLabelKey, variant, operational, applicable, authorized, authorization: variant === "own" ? definition.authorization : definition.externalAuthorization, availability: reason === null ? "active" : "disabled", disabledReason: reason, resolvedHandler: reason === null && href ? Object.freeze({ kind: "href" as const, href }) : null });`,
  `  const handlerCandidate = operational && applicable && href\n    ? Object.freeze({ kind: "href" as const, href })\n    : null;\n  const reason: ExchangeRoomActionDisabledReason | null = !operational ? "not-operational" : !applicable ? "not-applicable" : !authorized ? "not-authorized" : handlerCandidate ? null : "not-operational";\n  return Object.freeze({ ...definition, labelKey: variant === "own" ? definition.labelKey : definition.externalLabelKey, variant, operational, applicable, authorized, authorization: variant === "own" ? definition.authorization : definition.externalAuthorization, availability: reason === null ? "active" : "disabled", disabledReason: reason, handlerCandidate, resolvedHandler: reason === null ? handlerCandidate : null });`,
);

console.log("Applied handler-candidate compatibility to domain-owned action projections.");
