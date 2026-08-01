import type {
  TransactionalEmailPurpose,
  TransactionalEmailVariable,
} from "./transactional-email.ts";

export type TransactionalEmailTemplateVariableType =
  | "string"
  | "number"
  | "boolean";

export interface TransactionalEmailTemplateVariableDefinition {
  readonly key: string;
  readonly type: TransactionalEmailTemplateVariableType;
  readonly required: boolean;
  readonly maximumLength: number | null;
}

export interface TransactionalEmailTemplateDefinition {
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly purpose: TransactionalEmailPurpose;
  readonly variables: readonly TransactionalEmailTemplateVariableDefinition[];
  readonly subjectTemplate: string;
  readonly textTemplate: string;
  readonly htmlTemplate: string | null;
}

export interface TransactionalEmailTemplateReference {
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly purpose: TransactionalEmailPurpose;
}

function required(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximumLength) {
    throw new Error(`${label} cannot exceed ${maximumLength} characters.`);
  }
  return normalized;
}

function stableKey(value: string, label: string): string {
  const normalized = required(value, label, 128).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error(`${label} must be a stable lowercase identifier.`);
  }
  return normalized;
}

function positiveVersion(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 10_000) {
    throw new Error(`${label} must be an integer between 1 and 10000.`);
  }
  return value;
}

function variableDefinition(
  input: Readonly<{
    key: string;
    type: TransactionalEmailTemplateVariableType;
    required?: boolean;
    maximumLength?: number | null;
  }>,
): TransactionalEmailTemplateVariableDefinition {
  const key = stableKey(input.key, "Transactional email template variable key");
  if (!["string", "number", "boolean"].includes(input.type)) {
    throw new Error(`Unsupported transactional email template variable type: ${String(input.type)}.`);
  }
  let maximumLength: number | null = input.maximumLength ?? null;
  if (input.type !== "string" && maximumLength !== null) {
    throw new Error(`Transactional email template variable ${key} can limit length only for strings.`);
  }
  if (
    maximumLength !== null &&
    (!Number.isInteger(maximumLength) || maximumLength < 1 || maximumLength > 4_000)
  ) {
    throw new Error(
      `Transactional email template variable ${key} maximumLength must be between 1 and 4000.`,
    );
  }
  return Object.freeze({
    key,
    type: input.type,
    required: input.required ?? true,
    maximumLength,
  });
}

function templateText(value: string, label: string, maximumLength: number): string {
  const normalized = required(value, label, maximumLength);
  if (/{{\s*[^a-z0-9._:-]/i.test(normalized)) {
    throw new Error(`${label} contains a malformed template token.`);
  }
  return normalized;
}

function templateTokens(value: string | null): readonly string[] {
  if (!value) return Object.freeze([]);
  const values = [...value.matchAll(/{{\s*([a-z0-9][a-z0-9._:-]{0,127})\s*}}/gi)]
    .map((match) => stableKey(match[1] ?? "", "Transactional email template token"));
  return Object.freeze([...new Set(values)]);
}

export function createTransactionalEmailTemplateDefinition(input: Readonly<{
  eventKey: string;
  eventVersion: number;
  templateKey: string;
  templateVersion: number;
  purpose: TransactionalEmailPurpose;
  variables?: readonly Readonly<{
    key: string;
    type: TransactionalEmailTemplateVariableType;
    required?: boolean;
    maximumLength?: number | null;
  }>[];
  subjectTemplate: string;
  textTemplate: string;
  htmlTemplate?: string | null;
}>): TransactionalEmailTemplateDefinition {
  if (input.purpose !== "transactional" && input.purpose !== "administrative") {
    throw new Error(`Unsupported transactional email purpose: ${String(input.purpose)}.`);
  }

  const variables = (input.variables ?? []).map(variableDefinition);
  if (variables.length > 100) {
    throw new Error("Transactional email template variables cannot exceed 100 definitions.");
  }
  if (new Set(variables.map((definition) => definition.key)).size !== variables.length) {
    throw new Error("Transactional email template variable keys must be unique.");
  }

  const subjectTemplate = templateText(
    input.subjectTemplate,
    "Transactional email subject template",
    255,
  );
  const textTemplate = templateText(
    input.textTemplate,
    "Transactional email text template",
    100_000,
  );
  const htmlTemplate = input.htmlTemplate?.trim()
    ? templateText(input.htmlTemplate, "Transactional email HTML template", 200_000)
    : null;
  const declared = new Set(variables.map((definition) => definition.key));
  for (const token of [
    ...templateTokens(subjectTemplate),
    ...templateTokens(textTemplate),
    ...templateTokens(htmlTemplate),
  ]) {
    if (!declared.has(token)) {
      throw new Error(`Transactional email template token ${token} is not declared.`);
    }
  }

  return Object.freeze({
    eventKey: stableKey(input.eventKey, "Transactional email event key"),
    eventVersion: positiveVersion(input.eventVersion, "Transactional email event version"),
    templateKey: stableKey(input.templateKey, "Transactional email template key"),
    templateVersion: positiveVersion(input.templateVersion, "Transactional email template version"),
    purpose: input.purpose,
    variables: Object.freeze(variables),
    subjectTemplate,
    textTemplate,
    htmlTemplate,
  });
}

export function transactionalEmailTemplateReference(
  definition: TransactionalEmailTemplateDefinition,
): TransactionalEmailTemplateReference {
  return Object.freeze({
    eventKey: definition.eventKey,
    eventVersion: definition.eventVersion,
    templateKey: definition.templateKey,
    templateVersion: definition.templateVersion,
    purpose: definition.purpose,
  });
}

export function assertTransactionalEmailTemplateVariables(
  definition: TransactionalEmailTemplateDefinition,
  variables: Readonly<Record<string, TransactionalEmailVariable>>,
): void {
  const supplied = new Set(Object.keys(variables));
  const declared = new Map(definition.variables.map((item) => [item.key, item]));
  for (const key of supplied) {
    if (!declared.has(key)) {
      throw new Error(`Transactional email variable ${key} is not declared by ${definition.templateKey}.`);
    }
  }
  for (const item of definition.variables) {
    const value = variables[item.key];
    if (value === null || value === undefined) {
      if (item.required) {
        throw new Error(`Transactional email variable ${item.key} is required.`);
      }
      continue;
    }
    if (typeof value !== item.type) {
      throw new Error(
        `Transactional email variable ${item.key} must be ${item.type}, not ${typeof value}.`,
      );
    }
    if (
      item.type === "string" &&
      item.maximumLength !== null &&
      (value as string).length > item.maximumLength
    ) {
      throw new Error(
        `Transactional email variable ${item.key} cannot exceed ${item.maximumLength} characters.`,
      );
    }
  }
}
