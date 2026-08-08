import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import type {
  AmacsContractValidationResult,
  AmacsRuntimeContractValidatorPort,
} from "../../application/amacs/catalog.ts";

export class AmacsRuntimeSchemaValidator implements AmacsRuntimeContractValidatorPort {
  private readonly validators: ReadonlyMap<string, ValidateFunction>;

  constructor(validators: ReadonlyMap<string, ValidateFunction>) {
    this.validators = validators;
  }

  async validate<T>(schemaName: string, value: unknown): Promise<AmacsContractValidationResult<T>> {
    const validator = this.validators.get(schemaName);
    if (!validator) {
      return Object.freeze({
        valid: false,
        value: null,
        errors: Object.freeze([`Unsupported AMACS runtime schema: ${schemaName}`]),
      });
    }
    if (validator(value)) {
      return Object.freeze({ valid: true, value: value as T, errors: Object.freeze([]) });
    }
    return Object.freeze({
      valid: false,
      value: null,
      errors: Object.freeze((validator.errors ?? []).map((error) =>
        `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
      )),
    });
  }
}

export async function loadAmacsRuntimeSchemaValidator(
  root = process.cwd(),
): Promise<AmacsRuntimeSchemaValidator> {
  const schemaDirectory = path.join(root, "standards/amacs/releases/0.5.0/schemas");
  const names = (await readdir(schemaDirectory)).filter((name) => name.endsWith(".schema.json"));
  const schemas = await Promise.all(names.map(async (name) => ({
    name,
    schema: JSON.parse(await readFile(path.join(schemaDirectory, name), "utf8")),
  })));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  for (const { schema } of schemas) ajv.addSchema(schema);
  return new AmacsRuntimeSchemaValidator(new Map(
    schemas.map(({ name, schema }) => [name, ajv.getSchema(schema.$id) as ValidateFunction]),
  ));
}
