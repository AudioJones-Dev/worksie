CREATE TYPE "public"."contractor_document_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('operator', 'back_office', 'contractor', 'customer');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."payout_period_status" AS ENUM('open', 'draft', 'approved', 'paid');--> statement-breakpoint
CREATE TYPE "public"."payout_rule_mode" AS ENUM('piece_rate', 'completion_flat', 'hourly_capped');--> statement-breakpoint
CREATE TYPE "public"."proof_of_work_kind" AS ENUM('photo', 'video', 'signature', 'pdf', 'note');--> statement-breakpoint
CREATE TYPE "public"."work_order_event_source" AS ENUM('web_admin', 'mobile', 'system');--> statement-breakpoint
CREATE TYPE "public"."work_order_state" AS ENUM('draft', 'scheduled', 'dispatched', 'in_progress', 'awaiting_signoff', 'completed', 'invoiced', 'paid_out', 'cancelled', 'voided');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"dba" text,
	"jurisdictions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_safety_pack_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"checklist_template_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_instances_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"checklist_instance_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"label" text NOT NULL,
	"requires_photo" boolean DEFAULT false NOT NULL,
	"requires_signature" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	CONSTRAINT "checklist_steps_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"steps_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_templates_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contractor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contractor_membership_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"file_id" text,
	"issued_on" timestamp with time zone,
	"expires_on" timestamp with time zone,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"status" "contractor_document_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_signoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"signature_file_id" text NOT NULL,
	"signed_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"applies_to" text NOT NULL,
	"expirable" boolean DEFAULT false NOT NULL,
	"gating" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_types_tenant_id_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "document_types_applies_to_check" CHECK ("document_types"."applies_to" IN ('contractor', 'business', 'vehicle'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"status" "membership_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payout_period_id" uuid NOT NULL,
	"contractor_membership_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"work_order_line_item_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"computed_from" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL,
	"paid_on" timestamp with time zone,
	"status" "payout_period_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_periods_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mode" "payout_rule_mode" NOT NULL,
	"rate_table_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_rules_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proof_of_work_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"checklist_step_id" uuid,
	"kind" "proof_of_work_kind" NOT NULL,
	"file_id" text,
	"local_file_uri" text,
	"gps" jsonb,
	"captured_at" timestamp with time zone NOT NULL,
	"captured_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "safety_acknowledgements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contractor_membership_id" uuid NOT NULL,
	"safety_pack_id" uuid NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"signature_file_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "safety_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safety_packs_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"default_payout_rule_id" uuid,
	"checklist_template_id" uuid,
	"required_gear" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_safety_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customer_signoff_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_definitions_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"default_payout_period" text DEFAULT 'weekly_mon_sun' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"from_state" "work_order_state",
	"to_state" "work_order_state" NOT NULL,
	"actor" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"source" "work_order_event_source" NOT NULL,
	CONSTRAINT "work_order_events_cancelled_voided_needs_reason" CHECK ("work_order_events"."to_state" NOT IN ('cancelled', 'voided') OR ("work_order_events"."reason" IS NOT NULL AND length(btrim("work_order_events"."reason")) > 0))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'each' NOT NULL,
	"piece_rate_amount" numeric(12, 2),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_order_line_items_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_definition_id" uuid NOT NULL,
	"service_snapshot_json" jsonb NOT NULL,
	"customer_id" uuid NOT NULL,
	"address" text,
	"gps" jsonb,
	"scheduled_for" timestamp with time zone,
	"assigned_contractor_membership_id" uuid,
	"status" "work_order_state" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "work_orders_tenant_id_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_template_fk" FOREIGN KEY ("tenant_id","checklist_template_id") REFERENCES "public"."checklist_templates"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_steps" ADD CONSTRAINT "checklist_steps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_steps" ADD CONSTRAINT "checklist_steps_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_steps" ADD CONSTRAINT "checklist_steps_instance_fk" FOREIGN KEY ("tenant_id","checklist_instance_id") REFERENCES "public"."checklist_instances"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_docs_membership_fk" FOREIGN KEY ("tenant_id","contractor_membership_id") REFERENCES "public"."memberships"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contractor_documents" ADD CONSTRAINT "contractor_docs_doc_type_fk" FOREIGN KEY ("tenant_id","document_type_id") REFERENCES "public"."document_types"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_signoffs" ADD CONSTRAINT "customer_signoffs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_signoffs" ADD CONSTRAINT "customer_signoffs_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_types" ADD CONSTRAINT "document_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_period_fk" FOREIGN KEY ("tenant_id","payout_period_id") REFERENCES "public"."payout_periods"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_membership_fk" FOREIGN KEY ("tenant_id","contractor_membership_id") REFERENCES "public"."memberships"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_periods" ADD CONSTRAINT "payout_periods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_rules" ADD CONSTRAINT "payout_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proof_of_work_artifacts" ADD CONSTRAINT "proof_of_work_artifacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proof_of_work_artifacts" ADD CONSTRAINT "proof_of_work_artifacts_captured_by_users_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proof_of_work_artifacts" ADD CONSTRAINT "pow_artifacts_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_acknowledgements" ADD CONSTRAINT "safety_acknowledgements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_acknowledgements" ADD CONSTRAINT "safety_acks_membership_fk" FOREIGN KEY ("tenant_id","contractor_membership_id") REFERENCES "public"."memberships"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_acknowledgements" ADD CONSTRAINT "safety_acks_pack_fk" FOREIGN KEY ("tenant_id","safety_pack_id") REFERENCES "public"."safety_packs"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "safety_packs" ADD CONSTRAINT "safety_packs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_definitions" ADD CONSTRAINT "service_definitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_events" ADD CONSTRAINT "wo_events_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_line_items" ADD CONSTRAINT "work_order_line_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_line_items" ADD CONSTRAINT "wo_line_items_work_order_fk" FOREIGN KEY ("tenant_id","work_order_id") REFERENCES "public"."work_orders"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_service_def_fk" FOREIGN KEY ("tenant_id","service_definition_id") REFERENCES "public"."service_definitions"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."customers"("tenant_id","id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_profiles_tenant_idx" ON "business_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_profiles_default_safety_pack_idx" ON "business_profiles" USING btree ("default_safety_pack_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checklist_instances_tenant_idx" ON "checklist_instances" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "checklist_instances_work_order_unique" ON "checklist_instances" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checklist_steps_tenant_idx" ON "checklist_steps" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checklist_steps_completed_by_idx" ON "checklist_steps" USING btree ("completed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checklist_steps_instance_ordinal_idx" ON "checklist_steps" USING btree ("checklist_instance_id","ordinal");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checklist_templates_tenant_idx" ON "checklist_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contractor_documents_tenant_idx" ON "contractor_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contractor_documents_contractor_idx" ON "contractor_documents" USING btree ("contractor_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contractor_documents_type_idx" ON "contractor_documents" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contractor_documents_verified_by_idx" ON "contractor_documents" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contractor_documents_expires_idx" ON "contractor_documents" USING btree ("expires_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_signoffs_tenant_idx" ON "customer_signoffs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_signoffs_work_order_unique" ON "customer_signoffs" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_tenant_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_types_tenant_idx" ON "document_types" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "document_types_tenant_name_unique" ON "document_types" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "memberships_tenant_user_unique" ON "memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_tenant_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_tenant_idx" ON "payout_lines" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_period_idx" ON "payout_lines" USING btree ("payout_period_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_contractor_idx" ON "payout_lines" USING btree ("contractor_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_work_order_idx" ON "payout_lines" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_line_item_idx" ON "payout_lines" USING btree ("work_order_line_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_lines_computed_from_idx" ON "payout_lines" USING btree ("computed_from");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_periods_tenant_idx" ON "payout_periods" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payout_periods_tenant_range_unique" ON "payout_periods" USING btree ("tenant_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_rules_tenant_idx" ON "payout_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payout_rules_tenant_name_unique" ON "payout_rules" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_of_work_artifacts_tenant_idx" ON "proof_of_work_artifacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_of_work_artifacts_work_order_idx" ON "proof_of_work_artifacts" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_of_work_artifacts_captured_by_idx" ON "proof_of_work_artifacts" USING btree ("captured_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_of_work_artifacts_step_idx" ON "proof_of_work_artifacts" USING btree ("checklist_step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "safety_acknowledgements_tenant_idx" ON "safety_acknowledgements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "safety_acknowledgements_contractor_idx" ON "safety_acknowledgements" USING btree ("contractor_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "safety_acknowledgements_pack_idx" ON "safety_acknowledgements" USING btree ("safety_pack_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "safety_acknowledgements_contractor_pack_unique" ON "safety_acknowledgements" USING btree ("contractor_membership_id","safety_pack_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "safety_packs_tenant_idx" ON "safety_packs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "safety_packs_tenant_name_version_unique" ON "safety_packs" USING btree ("tenant_id","name","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_definitions_tenant_idx" ON "service_definitions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_definitions_default_payout_rule_idx" ON "service_definitions" USING btree ("default_payout_rule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_definitions_checklist_template_idx" ON "service_definitions" USING btree ("checklist_template_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_definitions_tenant_name_unique" ON "service_definitions" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_unique" ON "users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_events_tenant_idx" ON "work_order_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_events_actor_idx" ON "work_order_events" USING btree ("actor");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_events_work_order_at_idx" ON "work_order_events" USING btree ("work_order_id","at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_line_items_tenant_idx" ON "work_order_line_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_order_line_items_work_order_idx" ON "work_order_line_items" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_tenant_idx" ON "work_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_tenant_status_idx" ON "work_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_service_idx" ON "work_orders" USING btree ("service_definition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_customer_idx" ON "work_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_assigned_contractor_idx" ON "work_orders" USING btree ("assigned_contractor_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_created_by_idx" ON "work_orders" USING btree ("created_by");