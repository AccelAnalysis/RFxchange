import type {
  RecordRetentionAssignment,
  RetentionAssignmentId,
  RetentionPolicyClassification,
  RetentionPolicyId,
  RetentionPolicyKey,
  RetentionRecordId,
} from "./model";

export interface RetentionPolicyRepository {
  getById(id: RetentionPolicyId): Promise<RetentionPolicyClassification | null>;
  listByPolicyKey(policyKey: RetentionPolicyKey): Promise<readonly RetentionPolicyClassification[]>;
  append(policy: RetentionPolicyClassification): Promise<void>;
}

export interface RecordRetentionAssignmentRepository {
  getById(id: RetentionAssignmentId): Promise<RecordRetentionAssignment | null>;
  listByRecordId(recordId: RetentionRecordId): Promise<readonly RecordRetentionAssignment[]>;
  append(assignment: RecordRetentionAssignment): Promise<void>;
}

export interface RetentionRepositories {
  readonly policies: RetentionPolicyRepository;
  readonly assignments: RecordRetentionAssignmentRepository;
}
