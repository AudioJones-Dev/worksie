// Phase 2: PostgreSQL enum types mirrored from @worksie/domain.
// Domain literal arrays are the source of truth; pgEnum mirrors them into
// SQL so a domain-level addition shows up as a Drizzle diff and a migration.

import { pgEnum } from "drizzle-orm/pg-core";
import {
  CONTRACTOR_DOCUMENT_STATUSES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  PAYOUT_PERIOD_STATUSES,
  PAYOUT_RULE_MODES,
  PROOF_OF_WORK_KINDS,
  WORK_ORDER_EVENT_SOURCES,
  WORK_ORDER_STATES
} from "@worksie/domain";

export const workOrderStateEnum = pgEnum("work_order_state", WORK_ORDER_STATES);
export const workOrderEventSourceEnum = pgEnum(
  "work_order_event_source",
  WORK_ORDER_EVENT_SOURCES
);
export const membershipRoleEnum = pgEnum("membership_role", MEMBERSHIP_ROLES);
export const membershipStatusEnum = pgEnum(
  "membership_status",
  MEMBERSHIP_STATUSES
);
export const contractorDocumentStatusEnum = pgEnum(
  "contractor_document_status",
  CONTRACTOR_DOCUMENT_STATUSES
);
export const payoutRuleModeEnum = pgEnum("payout_rule_mode", PAYOUT_RULE_MODES);
export const payoutPeriodStatusEnum = pgEnum(
  "payout_period_status",
  PAYOUT_PERIOD_STATUSES
);
export const proofOfWorkKindEnum = pgEnum(
  "proof_of_work_kind",
  PROOF_OF_WORK_KINDS
);
