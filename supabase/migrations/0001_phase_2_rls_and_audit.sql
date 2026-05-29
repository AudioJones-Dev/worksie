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

-- Tenants the current auth user ADMINISTERS (operator / back_office). Write
-- access to config, financial and compliance-definition tables is gated on
-- this set; field roles (contractor) get read access plus narrowly-scoped
-- writes on operational tables only.
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

REVOKE ALL ON FUNCTION public.worksie_admin_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.worksie_admin_tenant_ids() TO authenticated;

-- The current auth user's own active membership ids (for self-service rows
-- such as a contractor's own documents and safety acknowledgements).
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

REVOKE ALL ON FUNCTION public.worksie_current_membership_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.worksie_current_membership_ids() TO authenticated;

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
-- Every row must belong to a tenant the current user is an active member of.
-- On top of that tenant boundary we split read from write by role:
--   * Config / financial / compliance-definition tables  → read: any member,
--     write (INSERT/UPDATE/DELETE): admins only (operator | back_office).
--   * Operational field tables (work orders, checklists, proof of work,
--     sign-offs)                                          → read+write: any member.
--   * Self-service compliance rows (a contractor's own documents and safety
--     acknowledgements)                                   → write: the owning
--     contractor or an admin; read: any member.
-- Postgres OR-combines permissive policies, so a FOR-ALL admin/owner write
-- policy plus a FOR-SELECT member policy yields member-read + scoped-write.
-- The bootstrap path (first tenant + membership) runs as service_role, which
-- bypasses RLS by Supabase convention.

-- Config / financial / compliance-definition tables: member read, admin write.
CREATE POLICY "member_read" ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.tenants
  FOR ALL TO authenticated
  USING (id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "member_read" ON public.business_profiles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.business_profiles
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "member_read" ON public.service_definitions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.service_definitions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "member_read" ON public.document_types
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.document_types
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

-- contractor_documents: a contractor manages their own; admins manage all.
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

CREATE POLICY "member_read" ON public.safety_packs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.safety_packs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

-- safety_acknowledgements: a contractor signs their own; admins manage all.
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

-- Operational field tables: read + write for any active member.
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

CREATE POLICY "member_read" ON public.checklist_templates
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.checklist_templates
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

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

CREATE POLICY "member_read" ON public.customers
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.customers
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "tenant_isolation" ON public.customer_signoffs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_current_tenant_ids()));

-- Financial tables: member read, admin write. (Period-scoped payout-line
-- immutability after approval is layered on in Phase 3.)
CREATE POLICY "member_read" ON public.payout_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_rules
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "member_read" ON public.payout_periods
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_periods
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

CREATE POLICY "member_read" ON public.payout_lines
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.payout_lines
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

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

-- memberships: any member can see the roster of their tenant; only admins can
-- invite/change/remove members. (Invitee self-activation is handled
-- server-side via service_role in Phase 3.)
CREATE POLICY "member_read" ON public.memberships
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.worksie_current_tenant_ids()));
CREATE POLICY "admin_write" ON public.memberships
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.worksie_admin_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.worksie_admin_tenant_ids()));

--------------------------------------------------------------------------
-- 5. Append-only enforcement for work_order_events.
--------------------------------------------------------------------------
-- DOMAIN_MODEL.md Hard Rule #5: "WorkOrderEvent is append-only — never
-- updated, never deleted, not even on cancelled or voided." Enforce in DB.
--
-- Caveat: the FKs on this table use ON DELETE CASCADE (tenant_id, work_order_id)
-- and ON DELETE SET NULL (actor). An unconditional block would make those
-- referential actions impossible, so deleting a tenant or work order — or even
-- deleting a user referenced as an actor — would always fail once any event
-- exists. We only block *direct* application mutations: when the statement
-- originates from a foreign-key referential action it runs nested inside an RI
-- trigger, so pg_trigger_depth() > 1 and we let it through.

CREATE OR REPLACE FUNCTION public.worksie_block_work_order_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Depth > 1 means we were reached via a cascade / SET NULL referential
  -- action (nested under the parent table's RI trigger); allow it.
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'work_order_events is append-only (canonical audit log)';
END;
$$;

CREATE TRIGGER work_order_events_block_update
BEFORE UPDATE ON public.work_order_events
FOR EACH ROW EXECUTE FUNCTION public.worksie_block_work_order_event_mutation();

CREATE TRIGGER work_order_events_block_delete
BEFORE DELETE ON public.work_order_events
FOR EACH ROW EXECUTE FUNCTION public.worksie_block_work_order_event_mutation();
