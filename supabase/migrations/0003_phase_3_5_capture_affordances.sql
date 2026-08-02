CREATE TYPE "public"."artifact_processing_status" AS ENUM('pending', 'uploading', 'stored', 'failed');--> statement-breakpoint
ALTER TYPE "public"."proof_of_work_kind" ADD VALUE 'audio' BEFORE 'signature';--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_instances" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_steps" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contractor_documents" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_signoffs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_periods" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_rules" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD COLUMN "content_hash" text;--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD COLUMN "processing_status" "artifact_processing_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "safety_acknowledgements" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "safety_packs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "service_definitions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "work_order_line_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "geofence_radius_m" integer;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_of_work_artifacts_content_hash_idx" ON "proof_of_work_artifacts" USING btree ("content_hash");--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD CONSTRAINT "proof_of_work_artifacts_tenant_id_id_unique" UNIQUE("tenant_id","id");--> statement-breakpoint
ALTER TABLE "proof_of_work_artifacts" ADD CONSTRAINT "proof_of_work_artifacts_note_requires_body" CHECK ("proof_of_work_artifacts"."kind" <> 'note' OR "proof_of_work_artifacts"."body" IS NOT NULL);