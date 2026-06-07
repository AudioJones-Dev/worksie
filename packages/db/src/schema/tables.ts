// Phase 2: canonical Drizzle schema for the 21 entities defined in
// docs/DOMAIN_MODEL.md. Every row carries `tenant_id`; RLS policies and the
// work_order_events append-only trigger live in the companion SQL migration.
//
// Hard rules enforced here (DB level):
//   - tenant_id is NOT NULL everywhere.
//   - work_orders.service_snapshot_json is NOT NULL (frozen at creation).
//   - work_order_events.reason is required when to_state ∈ {cancelled, voided}.
//   - Tenant integrity: references between two tenant-scoped tables are
//     COMPOSITE foreign keys on (tenant_id, id), so a row can never point at a
//     row in another tenant. Each referenced parent therefore carries a
//     unique (tenant_id, id) constraint. Optional links that use ON DELETE SET
//     NULL need PostgreSQL's column-scoped `SET NULL (col)` (so the NOT NULL
//     tenant_id is preserved); Drizzle can't emit that form, so those composite
//     FKs are declared in 0002_phase_2_tenant_scoped_fks.sql instead.
// Rules enforced in code (Phase 3+):
//   - Compliance gate (gating documents + safety acks).
//   - Work-order lifecycle transitions (see docs/WORK_ORDER_LIFECYCLE.md).
//   - Payout-line append-only inside an approved period.

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import {
  contractorDocumentStatusEnum,
  membershipRoleEnum,
  membershipStatusEnum,
  payoutPeriodStatusEnum,
  payoutRuleModeEnum,
  proofOfWorkKindEnum,
  workOrderEventSourceEnum,
  workOrderStateEnum
} from "./enums";

// 1. Tenant — top-level isolation container.
export const tenants = pgTable("tenants", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  timezone: text().notNull(),
  defaultPayoutPeriod: text().notNull().default("weekly_mon_sun"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
});

// 2. User — human with login credentials, 1:1 with Supabase auth.users.
// Global (not tenant-scoped): a user can be a member of several tenants.
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    authUserId: uuid().notNull(),
    email: text().notNull(),
    displayName: text(),
    phone: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    uniqueIndex("users_auth_user_id_unique").on(t.authUserId),
    uniqueIndex("users_email_lower_unique").on(sql`lower(${t.email})`)
  ]
);

// 3. Membership — join between User and Tenant carrying a role.
export const memberships = pgTable(
  "memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum().notNull(),
    status: membershipStatusEnum().notNull().default("invited"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    uniqueIndex("memberships_tenant_user_unique").on(t.tenantId, t.userId),
    unique("memberships_tenant_id_id_unique").on(t.tenantId, t.id),
    index("memberships_tenant_idx").on(t.tenantId),
    index("memberships_user_idx").on(t.userId)
  ]
);

// 4. Safety Pack — bundle of safety acknowledgements (referenced by
// business profiles and service definitions).
export const safetyPacks = pgTable(
  "safety_packs",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    version: integer().notNull().default(1),
    contentRef: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("safety_packs_tenant_idx").on(t.tenantId),
    unique("safety_packs_tenant_id_id_unique").on(t.tenantId, t.id),
    uniqueIndex("safety_packs_tenant_name_version_unique").on(
      t.tenantId,
      t.name,
      t.version
    )
  ]
);

// 5. Business Profile — operating business inside a tenant.
export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    legalName: text().notNull(),
    dba: text(),
    jurisdictions: jsonb()
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // FK to safety_packs is composite + ON DELETE SET NULL (default_safety_pack_id)
    // and lives in 0002 (Drizzle can't emit column-scoped SET NULL).
    defaultSafetyPackId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("business_profiles_tenant_idx").on(t.tenantId),
    index("business_profiles_default_safety_pack_idx").on(t.defaultSafetyPackId)
  ]
);

// 6. Document Type — required compliance artifact definition.
export const documentTypes = pgTable(
  "document_types",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    appliesTo: text().notNull(),
    expirable: boolean().notNull().default(false),
    gating: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("document_types_tenant_idx").on(t.tenantId),
    unique("document_types_tenant_id_id_unique").on(t.tenantId, t.id),
    uniqueIndex("document_types_tenant_name_unique").on(t.tenantId, t.name),
    check(
      "document_types_applies_to_check",
      sql`${t.appliesTo} IN ('contractor', 'business', 'vehicle')`
    )
  ]
);

// 7. Payout Rule — selects mode + rate table (referenced by service
// definitions and frozen onto work orders via service_snapshot_json).
export const payoutRules = pgTable(
  "payout_rules",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    mode: payoutRuleModeEnum().notNull(),
    rateTableJson: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("payout_rules_tenant_idx").on(t.tenantId),
    unique("payout_rules_tenant_id_id_unique").on(t.tenantId, t.id),
    uniqueIndex("payout_rules_tenant_name_unique").on(t.tenantId, t.name)
  ]
);

// 8. Checklist Template — ordered list of steps (stored inline as JSON;
// concrete per-work-order steps live on checklist_steps).
export const checklistTemplates = pgTable(
  "checklist_templates",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    stepsJson: jsonb()
      .$type<
        Array<{
          label: string;
          ordinal: number;
          requiresPhoto: boolean;
          requiresSignature: boolean;
        }>
      >()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("checklist_templates_tenant_idx").on(t.tenantId),
    unique("checklist_templates_tenant_id_id_unique").on(t.tenantId, t.id)
  ]
);

// 9. Service Definition — what the business is capable of performing.
export const serviceDefinitions = pgTable(
  "service_definitions",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    category: text().notNull(),
    // Composite + ON DELETE SET NULL FKs to payout_rules / checklist_templates
    // are declared in 0002.
    defaultPayoutRuleId: uuid(),
    checklistTemplateId: uuid(),
    requiredGear: jsonb()
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    requiredDocuments: jsonb()
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    requiredSafetySteps: jsonb()
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    customerSignoffRequired: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("service_definitions_tenant_idx").on(t.tenantId),
    unique("service_definitions_tenant_id_id_unique").on(t.tenantId, t.id),
    index("service_definitions_default_payout_rule_idx").on(
      t.defaultPayoutRuleId
    ),
    index("service_definitions_checklist_template_idx").on(
      t.checklistTemplateId
    ),
    uniqueIndex("service_definitions_tenant_name_unique").on(t.tenantId, t.name)
  ]
);

// 10. Customer — light-touch in v1 (no account, no login).
export const customers = pgTable(
  "customers",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text().notNull(),
    phone: text(),
    email: text(),
    address: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("customers_tenant_idx").on(t.tenantId),
    unique("customers_tenant_id_id_unique").on(t.tenantId, t.id)
  ]
);

// 11. Work Order — concrete instance of a service for a customer.
export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    serviceDefinitionId: uuid().notNull(),
    serviceSnapshotJson: jsonb().$type<Record<string, unknown>>().notNull(),
    customerId: uuid().notNull(),
    address: text(),
    gps: jsonb().$type<{ lat: number; lng: number }>(),
    scheduledFor: timestamp({ withTimezone: true }),
    // Composite + ON DELETE SET NULL FK to memberships lives in 0002.
    assignedContractorMembershipId: uuid(),
    status: workOrderStateEnum().notNull().default("draft"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" })
  },
  (t) => [
    unique("work_orders_tenant_id_id_unique").on(t.tenantId, t.id),
    foreignKey({
      name: "work_orders_service_def_fk",
      columns: [t.tenantId, t.serviceDefinitionId],
      foreignColumns: [serviceDefinitions.tenantId, serviceDefinitions.id]
    }).onDelete("restrict"),
    foreignKey({
      name: "work_orders_customer_fk",
      columns: [t.tenantId, t.customerId],
      foreignColumns: [customers.tenantId, customers.id]
    }).onDelete("restrict"),
    index("work_orders_tenant_idx").on(t.tenantId),
    index("work_orders_tenant_status_idx").on(t.tenantId, t.status),
    index("work_orders_service_idx").on(t.serviceDefinitionId),
    index("work_orders_customer_idx").on(t.customerId),
    index("work_orders_assigned_contractor_idx").on(
      t.assignedContractorMembershipId
    ),
    index("work_orders_created_by_idx").on(t.createdBy)
  ]
);

// 12. Work Order Line Item — drives piece-rate payout.
export const workOrderLineItems = pgTable(
  "work_order_line_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workOrderId: uuid().notNull(),
    description: text().notNull(),
    quantity: numeric({ precision: 12, scale: 3 }).notNull().default("1"),
    unit: text().notNull().default("each"),
    pieceRateAmount: numeric({ precision: 12, scale: 2 }),
    completedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique("work_order_line_items_tenant_id_id_unique").on(t.tenantId, t.id),
    foreignKey({
      name: "wo_line_items_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("cascade"),
    index("work_order_line_items_tenant_idx").on(t.tenantId),
    index("work_order_line_items_work_order_idx").on(t.workOrderId)
  ]
);

// 13. Work Order Event — immutable audit row per state transition.
// Append-only is enforced by trigger in the companion SQL migration.
export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workOrderId: uuid().notNull(),
    fromState: workOrderStateEnum(),
    toState: workOrderStateEnum().notNull(),
    actor: uuid().references(() => users.id, { onDelete: "set null" }),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    reason: text(),
    source: workOrderEventSourceEnum().notNull()
  },
  (t) => [
    foreignKey({
      name: "wo_events_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("cascade"),
    index("work_order_events_tenant_idx").on(t.tenantId),
    index("work_order_events_actor_idx").on(t.actor),
    index("work_order_events_work_order_at_idx").on(t.workOrderId, t.at),
    check(
      "work_order_events_cancelled_voided_needs_reason",
      sql`${t.toState} NOT IN ('cancelled', 'voided') OR (${t.reason} IS NOT NULL AND length(btrim(${t.reason})) > 0)`
    )
  ]
);

// 14. Checklist Instance — bound to a work order.
export const checklistInstances = pgTable(
  "checklist_instances",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workOrderId: uuid().notNull(),
    checklistTemplateId: uuid().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique("checklist_instances_tenant_id_id_unique").on(t.tenantId, t.id),
    foreignKey({
      name: "checklist_instances_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("cascade"),
    foreignKey({
      name: "checklist_instances_template_fk",
      columns: [t.tenantId, t.checklistTemplateId],
      foreignColumns: [checklistTemplates.tenantId, checklistTemplates.id]
    }).onDelete("restrict"),
    index("checklist_instances_tenant_idx").on(t.tenantId),
    uniqueIndex("checklist_instances_work_order_unique").on(t.workOrderId)
  ]
);

// 15. Checklist Step — per-instance step with completion + photo flags.
export const checklistSteps = pgTable(
  "checklist_steps",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    checklistInstanceId: uuid().notNull(),
    ordinal: integer().notNull(),
    label: text().notNull(),
    requiresPhoto: boolean().notNull().default(false),
    requiresSignature: boolean().notNull().default(false),
    completedAt: timestamp({ withTimezone: true }),
    completedBy: uuid().references(() => users.id, { onDelete: "set null" })
  },
  (t) => [
    unique("checklist_steps_tenant_id_id_unique").on(t.tenantId, t.id),
    foreignKey({
      name: "checklist_steps_instance_fk",
      columns: [t.tenantId, t.checklistInstanceId],
      foreignColumns: [checklistInstances.tenantId, checklistInstances.id]
    }).onDelete("cascade"),
    index("checklist_steps_tenant_idx").on(t.tenantId),
    index("checklist_steps_completed_by_idx").on(t.completedBy),
    index("checklist_steps_instance_ordinal_idx").on(
      t.checklistInstanceId,
      t.ordinal
    )
  ]
);

// 16. Proof-of-Work Artifact — photos, signatures, PDFs, notes.
export const proofOfWorkArtifacts = pgTable(
  "proof_of_work_artifacts",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workOrderId: uuid().notNull(),
    // Composite + ON DELETE SET NULL FK to checklist_steps lives in 0002.
    checklistStepId: uuid(),
    kind: proofOfWorkKindEnum().notNull(),
    fileId: text(),
    localFileUri: text(),
    gps: jsonb().$type<{ lat: number; lng: number }>(),
    capturedAt: timestamp({ withTimezone: true }).notNull(),
    capturedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: "pow_artifacts_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("cascade"),
    index("proof_of_work_artifacts_tenant_idx").on(t.tenantId),
    index("proof_of_work_artifacts_work_order_idx").on(t.workOrderId),
    index("proof_of_work_artifacts_captured_by_idx").on(t.capturedBy),
    index("proof_of_work_artifacts_step_idx").on(t.checklistStepId)
  ]
);

// 17. Customer Sign-off — captured at work-order completion if the service
// definition requires it.
export const customerSignoffs = pgTable(
  "customer_signoffs",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workOrderId: uuid().notNull(),
    signedAt: timestamp({ withTimezone: true }).notNull(),
    signatureFileId: text().notNull(),
    signedName: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: "customer_signoffs_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("cascade"),
    index("customer_signoffs_tenant_idx").on(t.tenantId),
    uniqueIndex("customer_signoffs_work_order_unique").on(t.workOrderId)
  ]
);

// 18. Contractor Document — submitted instance of a Document Type.
export const contractorDocuments = pgTable(
  "contractor_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    contractorMembershipId: uuid().notNull(),
    documentTypeId: uuid().notNull(),
    fileId: text(),
    issuedOn: timestamp({ withTimezone: true }),
    expiresOn: timestamp({ withTimezone: true }),
    verifiedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp({ withTimezone: true }),
    status: contractorDocumentStatusEnum().notNull().default("pending"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: "contractor_docs_membership_fk",
      columns: [t.tenantId, t.contractorMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }).onDelete("cascade"),
    foreignKey({
      name: "contractor_docs_doc_type_fk",
      columns: [t.tenantId, t.documentTypeId],
      foreignColumns: [documentTypes.tenantId, documentTypes.id]
    }).onDelete("restrict"),
    index("contractor_documents_tenant_idx").on(t.tenantId),
    index("contractor_documents_contractor_idx").on(t.contractorMembershipId),
    index("contractor_documents_type_idx").on(t.documentTypeId),
    index("contractor_documents_verified_by_idx").on(t.verifiedBy),
    index("contractor_documents_expires_idx").on(t.expiresOn)
  ]
);

// 19. Safety Acknowledgement — signed acknowledgement by a contractor.
export const safetyAcknowledgements = pgTable(
  "safety_acknowledgements",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    contractorMembershipId: uuid().notNull(),
    safetyPackId: uuid().notNull(),
    signedAt: timestamp({ withTimezone: true }).notNull(),
    signatureFileId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: "safety_acks_membership_fk",
      columns: [t.tenantId, t.contractorMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }).onDelete("cascade"),
    foreignKey({
      name: "safety_acks_pack_fk",
      columns: [t.tenantId, t.safetyPackId],
      foreignColumns: [safetyPacks.tenantId, safetyPacks.id]
    }).onDelete("restrict"),
    index("safety_acknowledgements_tenant_idx").on(t.tenantId),
    index("safety_acknowledgements_contractor_idx").on(t.contractorMembershipId),
    index("safety_acknowledgements_pack_idx").on(t.safetyPackId),
    uniqueIndex("safety_acknowledgements_contractor_pack_unique").on(
      t.contractorMembershipId,
      t.safetyPackId
    )
  ]
);

// 20. Payout Period — weekly Mon–Sun by default; status flow open → draft →
// approved → paid.
export const payoutPeriods = pgTable(
  "payout_periods",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    periodStart: timestamp({ withTimezone: true }).notNull(),
    periodEnd: timestamp({ withTimezone: true }).notNull(),
    cutoffAt: timestamp({ withTimezone: true }).notNull(),
    paidOn: timestamp({ withTimezone: true }),
    status: payoutPeriodStatusEnum().notNull().default("open"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index("payout_periods_tenant_idx").on(t.tenantId),
    unique("payout_periods_tenant_id_id_unique").on(t.tenantId, t.id),
    uniqueIndex("payout_periods_tenant_range_unique").on(
      t.tenantId,
      t.periodStart,
      t.periodEnd
    )
  ]
);

// 21. Payout Line — one row per (period, contractor, work order [, line item]).
export const payoutLines = pgTable(
  "payout_lines",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    payoutPeriodId: uuid().notNull(),
    contractorMembershipId: uuid().notNull(),
    workOrderId: uuid().notNull(),
    // Composite + ON DELETE SET NULL FKs to work_order_line_items / payout_rules
    // live in 0002.
    workOrderLineItemId: uuid(),
    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    computedFrom: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: "payout_lines_period_fk",
      columns: [t.tenantId, t.payoutPeriodId],
      foreignColumns: [payoutPeriods.tenantId, payoutPeriods.id]
    }).onDelete("cascade"),
    foreignKey({
      name: "payout_lines_membership_fk",
      columns: [t.tenantId, t.contractorMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }).onDelete("restrict"),
    foreignKey({
      name: "payout_lines_work_order_fk",
      columns: [t.tenantId, t.workOrderId],
      foreignColumns: [workOrders.tenantId, workOrders.id]
    }).onDelete("restrict"),
    index("payout_lines_tenant_idx").on(t.tenantId),
    index("payout_lines_period_idx").on(t.payoutPeriodId),
    index("payout_lines_contractor_idx").on(t.contractorMembershipId),
    index("payout_lines_work_order_idx").on(t.workOrderId),
    index("payout_lines_line_item_idx").on(t.workOrderLineItemId),
    index("payout_lines_computed_from_idx").on(t.computedFrom)
  ]
);
