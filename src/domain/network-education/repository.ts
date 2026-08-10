import type {
  NetworkEducationCommandReceipt,
  NetworkEducationEvent,
  NetworkEducationProgress,
} from "./model.ts";

export class NetworkEducationPersistenceConflictError extends Error {
  readonly code = "persistence-conflict" as const;

  constructor(message: string) {
    super(message);
    this.name = "NetworkEducationPersistenceConflictError";
  }
}

export interface NetworkEducationRepository {
  getProgress(id: string): Promise<NetworkEducationProgress | null>;
  getCommand(id: string): Promise<NetworkEducationCommandReceipt | null>;
  save(input: Readonly<{
    progress: NetworkEducationProgress;
    expectedVersion: number | null;
    event: NetworkEducationEvent;
    command: NetworkEducationCommandReceipt;
  }>): Promise<void>;
}
