import type {
  TransactionalEmailRequest,
  TransactionalEmailVariable,
} from "../../domain/communications/transactional-email.ts";
import {
  assertTransactionalEmailTemplateVariables,
  transactionalEmailTemplateReference,
  type TransactionalEmailTemplateDefinition,
  type TransactionalEmailTemplateReference,
} from "../../domain/communications/transactional-email-template.ts";

export interface TransactionalEmailRenderedTemplate {
  readonly content: Readonly<{
    subject: string;
    text: string;
    html: string | null;
  }>;
  readonly reference: TransactionalEmailTemplateReference;
}

function mappingKey(eventKey: string, eventVersion: number): string {
  return `${eventKey}@${String(eventVersion)}`;
}

function templateKey(templateKeyValue: string, templateVersion: number): string {
  return `${templateKeyValue}@${String(templateVersion)}`;
}

function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function variableText(value: TransactionalEmailVariable | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function interpolate(
  source: string,
  variables: Readonly<Record<string, TransactionalEmailVariable>>,
  escapeHtml: boolean,
): string {
  return source.replace(
    /{{\s*([a-z0-9][a-z0-9._:-]{0,127})\s*}}/gi,
    (_token, key: string) => {
      const value = variableText(variables[key.toLowerCase()]);
      return escapeHtml ? htmlEscape(value) : value;
    },
  );
}

/**
 * One reviewed catalog maps a platform event/version to one explicit template/version. It also
 * implements the structural content-renderer contract consumed by provider adapters, so provider
 * code never receives arbitrary templates or body content from a workflow.
 */
export class VersionedTransactionalEmailTemplateCatalog {
  private readonly byEvent = new Map<string, TransactionalEmailTemplateDefinition>();
  private readonly byTemplate = new Map<string, TransactionalEmailTemplateDefinition>();

  constructor(definitions: readonly TransactionalEmailTemplateDefinition[]) {
    if (definitions.length === 0) {
      throw new Error("At least one transactional email template definition is required.");
    }
    for (const definition of definitions) {
      const eventMapping = mappingKey(definition.eventKey, definition.eventVersion);
      const versionedTemplate = templateKey(definition.templateKey, definition.templateVersion);
      if (this.byEvent.has(eventMapping)) {
        throw new Error(`Transactional email event mapping ${eventMapping} is duplicated.`);
      }
      if (this.byTemplate.has(versionedTemplate)) {
        throw new Error(`Transactional email template ${versionedTemplate} is duplicated.`);
      }
      this.byEvent.set(eventMapping, definition);
      this.byTemplate.set(versionedTemplate, definition);
    }
  }

  resolveEvent(eventKey: string, eventVersion = 1): TransactionalEmailTemplateDefinition {
    const definition = this.byEvent.get(mappingKey(eventKey.trim().toLowerCase(), eventVersion));
    if (!definition) {
      throw new Error(
        `No transactional email template is mapped to ${eventKey.trim().toLowerCase()}@${String(eventVersion)}.`,
      );
    }
    return definition;
  }

  resolveTemplate(
    templateKeyValue: string,
    templateVersion: number,
  ): TransactionalEmailTemplateDefinition {
    const definition = this.byTemplate.get(
      templateKey(templateKeyValue.trim().toLowerCase(), templateVersion),
    );
    if (!definition) {
      throw new Error(
        `Transactional email template ${templateKeyValue.trim().toLowerCase()}@${String(templateVersion)} is not configured.`,
      );
    }
    return definition;
  }

  referenceForEvent(eventKey: string, eventVersion = 1): TransactionalEmailTemplateReference {
    return transactionalEmailTemplateReference(this.resolveEvent(eventKey, eventVersion));
  }

  renderVersioned(input: Readonly<{
    eventKey: string;
    eventVersion: number;
    templateKey: string;
    templateVersion: number;
    purpose: string;
    variables: Readonly<Record<string, TransactionalEmailVariable>>;
  }>): TransactionalEmailRenderedTemplate {
    const eventDefinition = this.resolveEvent(input.eventKey, input.eventVersion);
    const templateDefinition = this.resolveTemplate(input.templateKey, input.templateVersion);
    if (eventDefinition !== templateDefinition) {
      throw new Error("Transactional email event and template versions do not map to one definition.");
    }
    if (eventDefinition.purpose !== input.purpose) {
      throw new Error(
        `Transactional email purpose ${input.purpose} does not match template purpose ${eventDefinition.purpose}.`,
      );
    }
    assertTransactionalEmailTemplateVariables(eventDefinition, input.variables);
    return Object.freeze({
      content: Object.freeze({
        subject: interpolate(eventDefinition.subjectTemplate, input.variables, false),
        text: interpolate(eventDefinition.textTemplate, input.variables, false),
        html: eventDefinition.htmlTemplate
          ? interpolate(eventDefinition.htmlTemplate, input.variables, true)
          : null,
      }),
      reference: transactionalEmailTemplateReference(eventDefinition),
    });
  }

  async render(request: TransactionalEmailRequest): Promise<Readonly<{
    subject: string;
    text: string;
    html: string | null;
  }>> {
    const definition = this.byTemplate.get(templateKey(request.templateKey, 1));
    if (!definition || definition.eventKey !== request.eventKey) {
      throw new Error(
        `Transactional email request ${request.eventKey}/${request.templateKey} is not a reviewed event-template mapping.`,
      );
    }
    return this.renderVersioned({
      eventKey: definition.eventKey,
      eventVersion: definition.eventVersion,
      templateKey: definition.templateKey,
      templateVersion: definition.templateVersion,
      purpose: request.purpose,
      variables: request.variables,
    }).content;
  }
}
