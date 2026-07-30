import type {
  GeographyDefinition,
  GeographyId,
} from "../../domain/geography/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";

export class StaticGeographyDefinitionRepository implements GeographyDefinitionRepository {
  private readonly definitions: ReadonlyMap<GeographyId, GeographyDefinition>;

  constructor(definitions: readonly GeographyDefinition[]) {
    this.definitions = new Map(
      definitions.map((definition) => [definition.id, definition] as const),
    );
  }

  getById(id: GeographyId): Promise<GeographyDefinition | null> {
    return Promise.resolve(this.definitions.get(id) ?? null);
  }

  save(): Promise<void> {
    throw new Error("Static geography definitions are read-only.");
  }
}
