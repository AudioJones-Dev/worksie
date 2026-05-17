// Phase 1: placeholder schema. No tables defined yet.
// Phase 2 lands the canonical schema derived from docs/DOMAIN_MODEL.md:
// tenants, users, memberships, business_profiles, service_definitions
// (including customer_signoff_required), document_types,
// contractor_documents, safety_packs, safety_acknowledgements,
// work_orders, work_order_line_items, work_order_events,
// checklist_templates, checklist_instances, checklist_steps,
// proof_of_work_artifacts, customers, customer_signoffs,
// payout_rules, payout_periods, payout_lines.
// Every table carries tenant_id and is RLS-gated on it.
export const schema = {} as const;
