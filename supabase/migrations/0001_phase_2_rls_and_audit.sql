-- Phase 2 companion migration: RLS enable + tenant-isolation policies +
-- append-only enforcement for the canonical audit table.
--
-- This file is hand-written (not drizzle-kit emitted). Drizzle is the
-- source of truth for table shape; security and append-only are layered on
-- top here so they can be reviewed independently.
--
-- Auth model: Supabase Auth issues `auth.uid()` (the auth.users.id UUID).
-- A local `users` row links to it via `auth_user_id`. Tenant membership is
-- declared by `memberships`. The compliance gate, operator dashboards, and
-- mobile field views all flow tenant access through `memberships`.

--------------------------------------------------------------------------
-- 1. Helper: which tenants the current auth user is an ACTIVE member of?
--------------------------------------------------------------------------
-- SECURITY DEFINER is required so the function can read memberships and
-- users without recursing into RLS. search_path is locked to public so the
-- function can't be hijacked by a shadowed schema.

CREATE OR REPLACE FUNCTION public.worksie_current_tenant_ids()
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
$$;

REVOKE ALL ON FUNCTION public.worksie_current_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.worksie_current_tenant_ids() TO authenticated;

--------------------------------------------------------------------------
-- 2. Enable RLS on every canonical table.
--------------------------------------------------------------------------
-- Default-deny once enabled. Each table then gets a policy below.

ALTER TABLE public.tenants                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_definitions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_packs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_acknowledgements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_line_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_instances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_work_artifacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_signoffs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_rules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_periods            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_lines              ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------
-- 3. Tenant isolation policies (tables that carry tenant_id).
--------------------------------------------------------------------------
-- One uniform policy per table: the row's tenant_id must be one the
-- current user has an active membership in. The bootstrap path (creating
-- the first tenant + membership) is expected to run as service_role, which
-- bypasses RLS by Supabase convention.

CREATE POLICY "tenant_isolation" ON public.tenants
  FOR ALL TO authenticated
  USING (id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.business_profiles
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.service_definitions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.document_types
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.contractor_documents
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.safety_packs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.safety_acknowledgements
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.work_orders
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.work_order_line_items
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

-- work_order_events: SELECT and INSERT only via tenant isolation. UPDATE
-- and DELETE are blocked by triggers below (append-only).
CREATE POLICY "tenant_isolation_select" ON public.work_order_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation_insert" ON public.work_order_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.checklist_templates
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.checklist_instances
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.checklist_steps
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.proof_of_work_artifacts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.customers
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.customer_signoffs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.payout_rules
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.payout_periods
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.payout_lines
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

--------------------------------------------------------------------------
-- 4. Identity-table policies (users, memberships).
--------------------------------------------------------------------------
-- users: visible to self, plus to anyone who shares an active tenant via
-- memberships (so an operator can see contractors in their tenant).

CREATE POLICY "user_self_or_shared_tenant" ON public.users
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR id IN (
      SELECT m.user_id
      FROM public.memberships m
      WHERE m.tenant_id IN (SELECT public.worksie_current_tenant_ids())
    )
  );

CREATE POLICY "user_self_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "user_self_update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- memberships: same tenant isolation as the rest.
CREATE POLICY "tenant_isolation" ON public.memberships
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

--------------------------------------------------------------------------
-- 5. Append-only enforcement for work_order_events.
--------------------------------------------------------------------------
-- DOMAIN_MODEL.md Hard Rule #5: "WorkOrderEvent is append-only — never
-- updated, never deleted, not even on cancelled or voided." Enforce in DB.

CREATE OR REPLACE FUNCTION public.worksie_block_work_order_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'work_order_events is append-only (canonical audit log)';
END;
$$;

CREATE TRIGGER work_order_events_block_update
BEFORE UPDATE ON public.work_order_events
FOR EACH ROW EXECUTE FUNCTION public.worksie_block_work_order_event_mutation();

CREATE TRIGGER work_order_events_block_delete
BEFORE DELETE ON public.work_order_events
FOR EACH ROW EXECUTE FUNCTION public.worksie_block_work_order_event_mutation();
