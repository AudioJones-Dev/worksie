import fs from 'node:fs';
import { validateMilestoneAssignmentSplits } from '../backend/validation/milestoneAssignments.mjs';

const schema = fs.readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../prisma/migrations/20260506000000_initial/migration.sql', import.meta.url), 'utf8');

const checks = [
  {
    name: 'Auth persistence fields exist on User',
    ok: ['passwordHash', 'refreshTokenHash', 'refreshTokenExpires', 'lastLoginAt', 'sessionVersion'].every((field) => schema.includes(field)),
  },
  {
    name: 'Site uses organization-scoped Client relation',
    ok: schema.includes('client       Client       @relation(fields: [organizationId, clientId], references: [organizationId, id]'),
  },
  {
    name: 'Job uses organization-scoped Template, Client, and Site relations',
    ok: ['template     JobTemplate', 'client       Client', 'site         Site'].every((model) => schema.includes(model))
      && ['templateId', 'clientId', 'siteId'].every((field) => schema.includes(`@@index([organizationId, ${field}])`)),
  },
  {
    name: 'Invoices can reconcile to weekly billing batches',
    ok: schema.includes('billingBatchId String?') && schema.includes('billingBatch WeeklyBillingBatch?'),
  },
  {
    name: 'Milestone split percentage bounds and total guards are migrated',
    ok: migration.includes('CHECK ("splitPercentage" > 0 AND "splitPercentage" <= 100)')
      && migration.includes('MilestoneAssignment_split_insert_guard')
      && migration.includes('MilestoneAssignment_split_update_guard'),
  },
  {
    name: 'Runtime milestone split validator rejects totals over 100',
    ok: validateMilestoneAssignmentSplits([
      { contractorId: 'contractor_a', splitPercentage: 60 },
      { contractorId: 'contractor_b', splitPercentage: 41 },
    ]).some((error) => error.includes('cannot exceed 100')),
  },
];

const failures = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? '✓' : '✗'} ${check.name}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
