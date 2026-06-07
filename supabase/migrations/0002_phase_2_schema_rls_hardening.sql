-- Phase 2 forward hardening migration.
--
-- 0000_phase_2_canonical_schema.sql and 0001_phase_2_rls_and_audit.sql have
-- already landed on main. Do not edit those historical migrations for fixes:
-- existing databases will not replay them. This migration applies the schema,
-- FK, RLS, and append-only trigger hardening as a forward-only change.

--------------------------------------------------------------------------
-- 1. Parent uniqueness required by tenant-scoped composite foreign keys.
--------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.safety_packs ADD CONSTRAINT safety_packs_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.document_types ADD CONSTRAINT document_types_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_rules ADD CONSTRAINT payout_rules_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.checklist_templates ADD CONSTRAINT checklist_templates_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_order_line_items ADD CONSTRAINT work_order_line_items_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.checklist_instances ADD CONSTRAINT checklist_instances_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.checklist_steps ADD CONSTRAINT checklist_steps_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_periods ADD CONSTRAINT payout_periods_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.service_definitions ADD CONSTRAINT service_definitions_tenant_id_id_unique UNIQUE (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

--------------------------------------------------------------------------
-- 2. Supporting indexes for foreign-key checks and common lookups.
--------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS business_profiles_default_safety_pack_idx
  ON public.business_profiles USING btree (default_safety_pack_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_definitions_default_payout_rule_idx
  ON public.service_definitions USING btree (default_payout_rule_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_definitions_checklist_template_idx
  ON public.service_definitions USING btree (checklist_template_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_orders_created_by_idx
  ON public.work_orders USING btree (created_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_order_events_actor_idx
  ON public.work_order_events USING btree (actor);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS checklist_steps_completed_by_idx
  ON public.checklist_steps USING btree (completed_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS proof_of_work_artifacts_captured_by_idx
  ON public.proof_of_work_artifacts USING btree (captured_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contractor_documents_verified_by_idx
  ON public.contractor_documents USING btree (verified_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS payout_lines_line_item_idx
  ON public.payout_lines USING btree (work_order_line_item_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS payout_lines_computed_from_idx
  ON public.payout_lines USING btree (computed_from);
--> statement-breakpoint

--------------------------------------------------------------------------
-- 3. Replace single-column tenant-scoped FKs with composite tenant FKs.
--------------------------------------------------------------------------

ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_default_safety_pack_id_safety_packs_id_fk;
--> statement-breakpoint
ALTER TABLE public.checklist_instances
  DROP CONSTRAINT IF EXISTS checklist_instances_work_order_id_work_orders_id_fk,
  DROP CONSTRAINT IF EXISTS checklist_instances_checklist_template_id_checklist_templates_id_fk;
--> statement-breakpoint
ALTER TABLE public.checklist_steps
  DROP CONSTRAINT IF EXISTS checklist_steps_checklist_instance_id_checklist_instances_id_fk;
--> statement-breakpoint
ALTER TABLE public.contractor_documents
  DROP CONSTRAINT IF EXISTS contractor_documents_contractor_membership_id_memberships_id_fk,
  DROP CONSTRAINT IF EXISTS contractor_documents_document_type_id_document_types_id_fk;
--> statement-breakpoint
ALTER TABLE public.customer_signoffs
  DROP CONSTRAINT IF EXISTS customer_signoffs_work_order_id_work_orders_id_fk;
--> statement-breakpoint
ALTER TABLE public.payout_lines
  DROP CONSTRAINT IF EXISTS payout_lines_payout_period_id_payout_periods_id_fk,
  DROP CONSTRAINT IF EXISTS payout_lines_contractor_membership_id_memberships_id_fk,
  DROP CONSTRAINT IF EXISTS payout_lines_work_order_id_work_orders_id_fk,
  DROP CONSTRAINT IF EXISTS payout_lines_work_order_line_item_id_work_order_line_items_id_fk,
  DROP CONSTRAINT IF EXISTS payout_lines_computed_from_payout_rules_id_fk;
--> statement-breakpoint
ALTER TABLE public.proof_of_work_artifacts
  DROP CONSTRAINT IF EXISTS proof_of_work_artifacts_work_order_id_work_orders_id_fk,
  DROP CONSTRAINT IF EXISTS proof_of_work_artifacts_checklist_step_id_checklist_steps_id_fk;
--> statement-breakpoint
ALTER TABLE public.safety_acknowledgements
  DROP CONSTRAINT IF EXISTS safety_acknowledgements_contractor_membership_id_memberships_id_fk,
  DROP CONSTRAINT IF EXISTS safety_acknowledgements_safety_pack_id_safety_packs_id_fk;
--> statement-breakpoint
ALTER TABLE public.service_definitions
  DROP CONSTRAINT IF EXISTS service_definitions_default_payout_rule_id_payout_rules_id_fk,
  DROP CONSTRAINT IF EXISTS service_definitions_checklist_template_id_checklist_templates_id_fk;
--> statement-breakpoint
ALTER TABLE public.work_order_events
  DROP CONSTRAINT IF EXISTS work_order_events_work_order_id_work_orders_id_fk;
--> statement-breakpoint
ALTER TABLE public.work_order_line_items
  DROP CONSTRAINT IF EXISTS work_order_line_items_work_order_id_work_orders_id_fk;
--> statement-breakpoint
ALTER TABLE public.work_orders
  DROP CONSTRAINT IF EXISTS work_orders_service_definition_id_service_definitions_id_fk,
  DROP CONSTRAINT IF EXISTS work_orders_customer_id_customers_id_fk,
  DROP CONSTRAINT IF EXISTS work_orders_assigned_contractor_membership_id_memberships_id_fk;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE public.checklist_instances
    ADD CONSTRAINT checklist_instances_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.checklist_instances
    ADD CONSTRAINT checklist_instances_template_fk
    FOREIGN KEY (tenant_id, checklist_template_id)
    REFERENCES public.checklist_templates (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.checklist_steps
    ADD CONSTRAINT checklist_steps_instance_fk
    FOREIGN KEY (tenant_id, checklist_instance_id)
    REFERENCES public.checklist_instances (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.contractor_documents
    ADD CONSTRAINT contractor_docs_membership_fk
    FOREIGN KEY (tenant_id, contractor_membership_id)
    REFERENCES public.memberships (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.contractor_documents
    ADD CONSTRAINT contractor_docs_doc_type_fk
    FOREIGN KEY (tenant_id, document_type_id)
    REFERENCES public.document_types (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.customer_signoffs
    ADD CONSTRAINT customer_signoffs_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_lines
    ADD CONSTRAINT payout_lines_period_fk
    FOREIGN KEY (tenant_id, payout_period_id)
    REFERENCES public.payout_periods (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_lines
    ADD CONSTRAINT payout_lines_membership_fk
    FOREIGN KEY (tenant_id, contractor_membership_id)
    REFERENCES public.memberships (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_lines
    ADD CONSTRAINT payout_lines_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.proof_of_work_artifacts
    ADD CONSTRAINT pow_artifacts_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.safety_acknowledgements
    ADD CONSTRAINT safety_acks_membership_fk
    FOREIGN KEY (tenant_id, contractor_membership_id)
    REFERENCES public.memberships (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.safety_acknowledgements
    ADD CONSTRAINT safety_acks_pack_fk
    FOREIGN KEY (tenant_id, safety_pack_id)
    REFERENCES public.safety_packs (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_order_events
    ADD CONSTRAINT wo_events_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_order_line_items
    ADD CONSTRAINT wo_line_items_work_order_fk
    FOREIGN KEY (tenant_id, work_order_id)
    REFERENCES public.work_orders (tenant_id, id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_orders
    ADD CONSTRAINT work_orders_service_def_fk
    FOREIGN KEY (tenant_id, service_definition_id)
    REFERENCES public.service_definitions (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_orders
    ADD CONSTRAINT work_orders_customer_fk
    FOREIGN KEY (tenant_id, customer_id)
    REFERENCES public.customers (tenant_id, id)
    ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Optional composite FKs use PostgreSQL's column-scoped SET NULL so tenant_id
-- remains NOT NULL while the optional reference column is cleared.
DO $$ BEGIN
  ALTER TABLE public.business_profiles
    ADD CONSTRAINT business_profiles_default_safety_pack_fk
    FOREIGN KEY (tenant_id, default_safety_pack_id)
    REFERENCES public.safety_packs (tenant_id, id)
    ON DELETE SET NULL (default_safety_pack_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.service_definitions
    ADD CONSTRAINT service_definitions_default_payout_rule_fk
    FOREIGN KEY (tenant_id, default_payout_rule_id)
    REFERENCES public.payout_rules (tenant_id, id)
    ON DELETE SET NULL (default_payout_rule_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.service_definitions
    ADD CONSTRAINT service_definitions_checklist_template_fk
    FOREIGN KEY (tenant_id, checklist_template_id)
    REFERENCES public.checklist_templates (tenant_id, id)
    ON DELETE SET NULL (checklist_template_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.work_orders
    ADD CONSTRAINT work_orders_assigned_contractor_fk
    FOREIGN KEY (tenant_id, assigned_contractor_membership_id)
    REFERENCES public.memberships (tenant_id, id)
    ON DELETE SET NULL (assigned_contractor_membership_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.proof_of_work_artifacts
    ADD CONSTRAINT proof_of_work_artifacts_step_fk
    FOREIGN KEY (tenant_id, checklist_step_id)
    REFERENCES public.checklist_steps (tenant_id, id)
    ON DELETE SET NULL (checklist_step_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_lines
    ADD CONSTRAINT payout_lines_line_item_fk
    FOREIGN KEY (tenant_id, work_order_line_item_id)
    REFERENCES public.work_order_line_items (tenant_id, id)
    ON DELETE SET NULL (work_order_line_item_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.payout_lines
    ADD CONSTRAINT payout_lines_computed_from_fk
    FOREIGN KEY (tenant_id, computed_from)
    REFERENCES public.payout_rules (tenant_id, id)
    ON DELETE SET NULL (computed_from);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

--------------------------------------------------------------------------
-- 4. RLS helpers and role-scoped policy hardening.
--------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.worksie_admin_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.tenant_id
  FROM memberships m
  INNER JOIN users u ON u.id = m.user_id
  WHERE u.auth_user_id = auth.uid()
    AND m.status = 'active'
    AND m.role IN ('operator', 'back_office')
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.worksie_admin_tenant_ids() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.worksie_admin_tenant_ids() TO authenticated;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.worksie_current_membership_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id
  FROM memberships m
  INNER JOIN users u ON u.id = m.user_id
  WHERE u.auth_user_id = auth.uid()
    AND m.status = 'active'
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.worksie_current_membership_ids() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.worksie_current_membership_ids() TO authenticated;
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.tenants;
DROP POLICY IF EXISTS "member_read" ON public.tenants;
DROP POLICY IF EXISTS "admin_write" ON public.tenants;
CREATE POLICY "member_read" ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.tenants
  FOR ALL TO authenticated
  USING (id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.business_profiles;
DROP POLICY IF EXISTS "member_read" ON public.business_profiles;
DROP POLICY IF EXISTS "admin_write" ON public.business_profiles;
CREATE POLICY "member_read" ON public.business_profiles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.business_profiles
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.service_definitions;
DROP POLICY IF EXISTS "member_read" ON public.service_definitions;
DROP POLICY IF EXISTS "admin_write" ON public.service_definitions;
CREATE POLICY "member_read" ON public.service_definitions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.service_definitions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.document_types;
DROP POLICY IF EXISTS "member_read" ON public.document_types;
DROP POLICY IF EXISTS "admin_write" ON public.document_types;
CREATE POLICY "member_read" ON public.document_types
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.document_types
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.contractor_documents;
DROP POLICY IF EXISTS "member_read" ON public.contractor_documents;
DROP POLICY IF EXISTS "owner_or_admin_write" ON public.contractor_documents;
CREATE POLICY "member_read" ON public.contractor_documents
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "owner_or_admin_write" ON public.contractor_documents
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.worksie_admin_tenant_ids())
    OR contractor_membership_id IN (SELECT public.worksie_current_membership_ids())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.worksie_admin_tenant_ids())
    OR contractor_membership_id IN (SELECT public.worksie_current_membership_ids())
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.safety_packs;
DROP POLICY IF EXISTS "member_read" ON public.safety_packs;
DROP POLICY IF EXISTS "admin_write" ON public.safety_packs;
CREATE POLICY "member_read" ON public.safety_packs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.safety_packs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.safety_acknowledgements;
DROP POLICY IF EXISTS "member_read" ON public.safety_acknowledgements;
DROP POLICY IF EXISTS "owner_or_admin_write" ON public.safety_acknowledgements;
CREATE POLICY "member_read" ON public.safety_acknowledgements
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "owner_or_admin_write" ON public.safety_acknowledgements
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.worksie_admin_tenant_ids())
    OR contractor_membership_id IN (SELECT public.worksie_current_membership_ids())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.worksie_admin_tenant_ids())
    OR contractor_membership_id IN (SELECT public.worksie_current_membership_ids())
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.checklist_templates;
DROP POLICY IF EXISTS "member_read" ON public.checklist_templates;
DROP POLICY IF EXISTS "admin_write" ON public.checklist_templates;
CREATE POLICY "member_read" ON public.checklist_templates
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.checklist_templates
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.customers;
DROP POLICY IF EXISTS "member_read" ON public.customers;
DROP POLICY IF EXISTS "admin_write" ON public.customers;
CREATE POLICY "member_read" ON public.customers
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.customers
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.payout_rules;
DROP POLICY IF EXISTS "member_read" ON public.payout_rules;
DROP POLICY IF EXISTS "admin_write" ON public.payout_rules;
CREATE POLICY "member_read" ON public.payout_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_rules
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.payout_periods;
DROP POLICY IF EXISTS "member_read" ON public.payout_periods;
DROP POLICY IF EXISTS "admin_write" ON public.payout_periods;
CREATE POLICY "member_read" ON public.payout_periods
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_periods
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.payout_lines;
DROP POLICY IF EXISTS "member_read" ON public.payout_lines;
DROP POLICY IF EXISTS "admin_write" ON public.payout_lines;
CREATE POLICY "member_read" ON public.payout_lines
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_lines
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

DROP POLICY IF EXISTS "tenant_isolation" ON public.memberships;
DROP POLICY IF EXISTS "member_read" ON public.memberships;
DROP POLICY IF EXISTS "admin_write" ON public.memberships;
CREATE POLICY "member_read" ON public.memberships
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.memberships
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));
--> statement-breakpoint

--------------------------------------------------------------------------
-- 5. Allow FK referential actions while preserving direct append-only block.
--------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.worksie_block_work_order_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- FK cascades and SET NULL actions invoke this trigger internally. Let those
  -- referential actions complete, but keep blocking direct UPDATE/DELETE.
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'work_order_events is append-only (canonical audit log)';
END;
$$;
