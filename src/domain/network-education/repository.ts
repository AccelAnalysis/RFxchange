import type {
  NetworkEducationCommandReceipt,
  NetworkEducationEvent,
  NetworkEducationProgress,
} from "./model.ts";

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
