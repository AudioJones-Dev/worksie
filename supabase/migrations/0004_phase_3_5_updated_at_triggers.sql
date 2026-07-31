-- Phase 3.5: maintain updated_at.
--
-- Hand-written because Drizzle cannot emit functions or triggers.
-- 0003_phase_3_5_capture_affordances.sql added the updated_at columns; this
-- migration makes them move.
--
-- Why this matters: docs/OFFLINE_FIRST_ARCHITECTURE.md resolves Class B sync
-- conflicts by last-writer-wins per field. That rule needs a server-side change
-- marker to compare against. A DEFAULT now() only fires on INSERT, so without
-- this trigger updated_at would equal created_at forever and the conflict rule
-- would be unimplementable.
--
-- Setting the value server-side rather than trusting the client is deliberate:
-- docs/OFFLINE_FIRST_ARCHITECTURE.md § Authority Rules already establishes that
-- device clocks are display-only and the server owns audit time. A mobile
-- client with a skewed clock must not be able to win a conflict it should lose.

CREATE OR REPLACE FUNCTION public.worksie_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Every table carrying updated_at. work_order_events is deliberately absent:
-- it is append-only by trigger (worksie_block_work_order_event_mutation in
-- 0001) and already carries `at`, so it has no UPDATE path to hook.
DO $$
DECLARE
  target text;
  targets text[] := ARRAY[
    'tenants',
    'users',
    'memberships',
    'business_profiles',
    'service_definitions',
    'document_types',
    'contractor_documents',
    'safety_packs',
    'safety_acknowledgements',
    'work_orders',
    'work_order_line_items',
    'checklist_templates',
    'checklist_instances',
    'checklist_steps',
    'proof_of_work_artifacts',
    'customers',
    'customer_signoffs',
    'payout_rules',
    'payout_periods',
    'payout_lines'
  ];
BEGIN
  FOREACH target IN ARRAY targets LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      target || '_set_updated_at',
      target
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.worksie_set_updated_at()',
      target || '_set_updated_at',
      target
    );
  END LOOP;
END;
$$;
