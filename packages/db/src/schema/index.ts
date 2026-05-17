// Canonical Worksie schema — 21 entities from docs/DOMAIN_MODEL.md.
// Source of truth for Drizzle, drizzle-kit, and the Supabase migration pipeline.

export * from "./enums";
export * from "./tables";

import {
  businessProfiles,
  checklistInstances,
  checklistSteps,
  checklistTemplates,
  contractorDocuments,
  customerSignoffs,
  customers,
  documentTypes,
  memberships,
  payoutLines,
  payoutPeriods,
  payoutRules,
  proofOfWorkArtifacts,
  safetyAcknowledgements,
  safetyPacks,
  serviceDefinitions,
  tenants,
  users,
  workOrderEvents,
  workOrderLineItems,
  workOrders
} from "./tables";

export const schema = {
  tenants,
  users,
  memberships,
  businessProfiles,
  serviceDefinitions,
  documentTypes,
  contractorDocuments,
  safetyPacks,
  safetyAcknowledgements,
  workOrders,
  workOrderLineItems,
  workOrderEvents,
  checklistTemplates,
  checklistInstances,
  checklistSteps,
  proofOfWorkArtifacts,
  customers,
  customerSignoffs,
  payoutRules,
  payoutPeriods,
  payoutLines
} as const;
