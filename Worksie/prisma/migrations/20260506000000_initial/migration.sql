PRAGMA foreign_keys=OFF;

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'CONTRACTOR',
  "passwordHash" TEXT,
  "refreshTokenHash" TEXT,
  "refreshTokenExpires" DATETIME,
  "lastLoginAt" DATETIME,
  "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "billingEmail" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Site" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Site_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Site_org_client_fkey" FOREIGN KEY ("organizationId", "clientId") REFERENCES "Client" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "JobTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "JobTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TemplateMilestone" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "TemplateMilestone_template_fkey" FOREIGN KEY ("organizationId", "templateId") REFERENCES "JobTemplate" ("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "scheduledFor" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Job_template_fkey" FOREIGN KEY ("organizationId", "templateId") REFERENCES "JobTemplate" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Job_client_fkey" FOREIGN KEY ("organizationId", "clientId") REFERENCES "Client" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Job_site_fkey" FOREIGN KEY ("organizationId", "siteId") REFERENCES "Site" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "JobMilestone" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "templateMilestoneId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "JobMilestone_job_fkey" FOREIGN KEY ("organizationId", "jobId") REFERENCES "Job" ("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "JobMilestone_templateMilestone_fkey" FOREIGN KEY ("organizationId", "templateMilestoneId") REFERENCES "TemplateMilestone" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MilestoneAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "contractorId" TEXT NOT NULL,
  "splitPercentage" DECIMAL NOT NULL CHECK ("splitPercentage" > 0 AND "splitPercentage" <= 100),
  CONSTRAINT "MilestoneAssignment_milestone_fkey" FOREIGN KEY ("organizationId", "milestoneId") REFERENCES "JobMilestone" ("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MilestoneAssignment_contractor_fkey" FOREIGN KEY ("organizationId", "contractorId") REFERENCES "User" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "WeeklyBillingBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "weekStartsOn" DATETIME NOT NULL,
  "weekEndsOn" DATETIME NOT NULL,
  "closedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "WeeklyBillingBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "billingBatchId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "totalCents" INTEGER NOT NULL,
  "issuedAt" DATETIME,
  "paidAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invoice_job_fkey" FOREIGN KEY ("organizationId", "jobId") REFERENCES "Job" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Invoice_client_fkey" FOREIGN KEY ("organizationId", "clientId") REFERENCES "Client" ("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Invoice_billingBatch_fkey" FOREIGN KEY ("billingBatchId") REFERENCES "WeeklyBillingBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");
CREATE UNIQUE INDEX "User_organizationId_id_key" ON "User"("organizationId", "id");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE UNIQUE INDEX "Client_organizationId_id_key" ON "Client"("organizationId", "id");
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");
CREATE UNIQUE INDEX "Site_organizationId_id_key" ON "Site"("organizationId", "id");
CREATE INDEX "Site_organizationId_clientId_idx" ON "Site"("organizationId", "clientId");
CREATE UNIQUE INDEX "JobTemplate_organizationId_id_key" ON "JobTemplate"("organizationId", "id");
CREATE INDEX "JobTemplate_organizationId_idx" ON "JobTemplate"("organizationId");
CREATE UNIQUE INDEX "TemplateMilestone_organizationId_id_key" ON "TemplateMilestone"("organizationId", "id");
CREATE UNIQUE INDEX "TemplateMilestone_organizationId_templateId_sortOrder_key" ON "TemplateMilestone"("organizationId", "templateId", "sortOrder");
CREATE INDEX "TemplateMilestone_organizationId_templateId_idx" ON "TemplateMilestone"("organizationId", "templateId");
CREATE UNIQUE INDEX "Job_organizationId_id_key" ON "Job"("organizationId", "id");
CREATE INDEX "Job_organizationId_templateId_idx" ON "Job"("organizationId", "templateId");
CREATE INDEX "Job_organizationId_clientId_idx" ON "Job"("organizationId", "clientId");
CREATE INDEX "Job_organizationId_siteId_idx" ON "Job"("organizationId", "siteId");
CREATE UNIQUE INDEX "JobMilestone_organizationId_id_key" ON "JobMilestone"("organizationId", "id");
CREATE UNIQUE INDEX "JobMilestone_organizationId_jobId_sortOrder_key" ON "JobMilestone"("organizationId", "jobId", "sortOrder");
CREATE INDEX "JobMilestone_organizationId_templateMilestoneId_idx" ON "JobMilestone"("organizationId", "templateMilestoneId");
CREATE UNIQUE INDEX "MilestoneAssignment_organizationId_milestoneId_contractorId_key" ON "MilestoneAssignment"("organizationId", "milestoneId", "contractorId");
CREATE INDEX "MilestoneAssignment_organizationId_milestoneId_idx" ON "MilestoneAssignment"("organizationId", "milestoneId");
CREATE UNIQUE INDEX "WeeklyBillingBatch_organizationId_weekStartsOn_key" ON "WeeklyBillingBatch"("organizationId", "weekStartsOn");
CREATE UNIQUE INDEX "WeeklyBillingBatch_organizationId_id_key" ON "WeeklyBillingBatch"("organizationId", "id");
CREATE INDEX "WeeklyBillingBatch_organizationId_idx" ON "WeeklyBillingBatch"("organizationId");
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");
CREATE INDEX "Invoice_organizationId_billingBatchId_idx" ON "Invoice"("organizationId", "billingBatchId");
CREATE INDEX "Invoice_organizationId_clientId_idx" ON "Invoice"("organizationId", "clientId");
CREATE INDEX "Invoice_organizationId_jobId_idx" ON "Invoice"("organizationId", "jobId");

CREATE TRIGGER "MilestoneAssignment_split_insert_guard"
BEFORE INSERT ON "MilestoneAssignment"
FOR EACH ROW
WHEN (SELECT COALESCE(SUM("splitPercentage"), 0) FROM "MilestoneAssignment" WHERE "organizationId" = NEW."organizationId" AND "milestoneId" = NEW."milestoneId") + NEW."splitPercentage" > 100
BEGIN
  SELECT RAISE(ABORT, 'milestone assignment split total cannot exceed 100');
END;

CREATE TRIGGER "MilestoneAssignment_split_update_guard"
BEFORE UPDATE OF "splitPercentage", "milestoneId", "organizationId" ON "MilestoneAssignment"
FOR EACH ROW
WHEN (SELECT COALESCE(SUM("splitPercentage"), 0) FROM "MilestoneAssignment" WHERE "organizationId" = NEW."organizationId" AND "milestoneId" = NEW."milestoneId" AND "id" != OLD."id") + NEW."splitPercentage" > 100
BEGIN
  SELECT RAISE(ABORT, 'milestone assignment split total cannot exceed 100');
END;

PRAGMA foreign_keys=ON;
