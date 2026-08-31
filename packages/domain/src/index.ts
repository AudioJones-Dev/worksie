// Shared, dependency-free domain constants and string-literal types.
// Mirrors docs/DOMAIN_MODEL.md and docs/WORK_ORDER_LIFECYCLE.md.
// Phase 1 exposes names and lifecycle enums only. Phase 2 layers in the
// rules engine (compliance gate, payout computation, transition guards).

export const ENTITY_NAMES = [
  "Tenant",
  "User",
  "Membership",
  "BusinessProfile",
  "ServiceDefinition",
  "DocumentType",
  "ContractorDocument",
  "SafetyPack",
  "SafetyAcknowledgement",
  "WorkOrder",
  "WorkOrderLineItem",
  "WorkOrderEvent",
  "ChecklistTemplate",
  "ChecklistInstance",
  "ChecklistStep",
  "ProofOfWorkArtifact",
  "Customer",
  "CustomerSignoff",
  "PayoutRule",
  "PayoutPeriod",
  "PayoutLine"
] as const;
export type EntityName = (typeof ENTITY_NAMES)[number];

export const WORK_ORDER_STATES = [
  "draft",
  "scheduled",
  "dispatched",
  "in_progress",
  "awaiting_signoff",
  "completed",
  "invoiced",
  "paid_out",
  "cancelled",
  "voided"
] as const;
export type WorkOrderState = (typeof WORK_ORDER_STATES)[number];

export const TERMINAL_WORK_ORDER_STATES = ["paid_out", "cancelled", "voided"] as const satisfies readonly WorkOrderState[];
export type TerminalWorkOrderState = (typeof TERMINAL_WORK_ORDER_STATES)[number];

export const WORK_ORDER_EVENT_SOURCES = ["web_admin", "mobile", "system"] as const;
export type WorkOrderEventSource = (typeof WORK_ORDER_EVENT_SOURCES)[number];

export const MEMBERSHIP_ROLES = ["operator", "back_office", "contractor", "customer"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["invited", "active", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const CONTRACTOR_DOCUMENT_STATUSES = ["pending", "verified", "rejected", "expired"] as const;
export type ContractorDocumentStatus = (typeof CONTRACTOR_DOCUMENT_STATUSES)[number];

export const PAYOUT_RULE_MODES = ["piece_rate", "completion_flat", "hourly_capped"] as const;
export type PayoutRuleMode = (typeof PAYOUT_RULE_MODES)[number];

export const PAYOUT_PERIOD_STATUSES = ["open", "draft", "approved", "paid"] as const;
export type PayoutPeriodStatus = (typeof PAYOUT_PERIOD_STATUSES)[number];

export const PROOF_OF_WORK_KINDS = ["photo", "video", "signature", "pdf", "note"] as const;
export type ProofOfWorkKind = (typeof PROOF_OF_WORK_KINDS)[number];

// Sync classes per docs/OFFLINE_FIRST_ARCHITECTURE.md.
export const SYNC_CLASSES = ["A_reference", "B_assigned", "C_append_only", "D_server_only"] as const;
export type SyncClass = (typeof SYNC_CLASSES)[number];

export {
  accessibilityRampInstallFixture,
  createAccessibilityRampInstallReadModel
} from "./accessibility-ramp-read-model";
export type {
  AccessibilityRampWorkOrderReadModel,
  RampChecklistStepFixture,
  RampComplianceRequirement,
  RampInstallFixture,
  RampLineItemFixture,
  RampProofRequirement
} from "./accessibility-ramp-read-model";
