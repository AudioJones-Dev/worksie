-- Phase 2: tenant-scoped composite foreign keys for the OPTIONAL links that use
-- ON DELETE SET NULL.
--
-- These are hand-written (not drizzle-kit emitted) because they need
-- PostgreSQL's column-scoped `SET NULL (col)` form: the FK spans
-- (tenant_id, <ref_id>) so a row can never point at another tenant's row, but
-- tenant_id is NOT NULL, so a plain `ON DELETE SET NULL` (which would null the
-- whole key) is impossible. `SET NULL (<ref_id>)` nulls only the optional
-- column and leaves tenant_id intact. Requires PostgreSQL 15+ (Supabase is 15).
--
-- With the default MATCH SIMPLE semantics, the constraint is skipped while the
-- optional column is NULL and enforced (same-tenant) once it is set.

ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_default_safety_pack_fk
  FOREIGN KEY (tenant_id, default_safety_pack_id)
  REFERENCES public.safety_packs (tenant_id, id)
  ON DELETE SET NULL (default_safety_pack_id);
--> statement-breakpoint
ALTER TABLE public.service_definitions
  ADD CONSTRAINT service_definitions_default_payout_rule_fk
  FOREIGN KEY (tenant_id, default_payout_rule_id)
  REFERENCES public.payout_rules (tenant_id, id)
  ON DELETE SET NULL (default_payout_rule_id);
--> statement-breakpoint
ALTER TABLE public.service_definitions
  ADD CONSTRAINT service_definitions_checklist_template_fk
  FOREIGN KEY (tenant_id, checklist_template_id)
  REFERENCES public.checklist_templates (tenant_id, id)
  ON DELETE SET NULL (checklist_template_id);
--> statement-breakpoint
ALTER TABLE public.work_orders
  ADD CONSTRAINT work_orders_assigned_contractor_fk
  FOREIGN KEY (tenant_id, assigned_contractor_membership_id)
  REFERENCES public.memberships (tenant_id, id)
  ON DELETE SET NULL (assigned_contractor_membership_id);
--> statement-breakpoint
ALTER TABLE public.proof_of_work_artifacts
  ADD CONSTRAINT proof_of_work_artifacts_step_fk
  FOREIGN KEY (tenant_id, checklist_step_id)
  REFERENCES public.checklist_steps (tenant_id, id)
  ON DELETE SET NULL (checklist_step_id);
--> statement-breakpoint
ALTER TABLE public.payout_lines
  ADD CONSTRAINT payout_lines_line_item_fk
  FOREIGN KEY (tenant_id, work_order_line_item_id)
  REFERENCES public.work_order_line_items (tenant_id, id)
  ON DELETE SET NULL (work_order_line_item_id);
--> statement-breakpoint
ALTER TABLE public.payout_lines
  ADD CONSTRAINT payout_lines_computed_from_fk
  FOREIGN KEY (tenant_id, computed_from)
  REFERENCES public.payout_rules (tenant_id, id)
  ON DELETE SET NULL (computed_from);
