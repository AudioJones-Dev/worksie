import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedTemplateMilestones = [
  { name: 'Site readiness', sortOrder: 1 },
  { name: 'Field work complete', sortOrder: 2 },
  { name: 'Client sign-off', sortOrder: 3 },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: 'org_seed_worksie' },
    update: { name: 'Worksie Demo Org' },
    create: { id: 'org_seed_worksie', name: 'Worksie Demo Org' },
  });

  const template = await prisma.jobTemplate.upsert({
    where: { id: 'tmpl_seed_standard_site_visit' },
    update: {
      organizationId: organization.id,
      name: 'Standard Site Visit',
      active: true,
    },
    create: {
      id: 'tmpl_seed_standard_site_visit',
      organizationId: organization.id,
      name: 'Standard Site Visit',
      active: true,
    },
  });

  // Reset the seeded template milestones before recreating the current list so
  // renamed or removed demo milestones do not linger as stale records.
  await prisma.templateMilestone.deleteMany({
    where: {
      organizationId: organization.id,
      templateId: template.id,
    },
  });

  await prisma.templateMilestone.createMany({
    data: seedTemplateMilestones.map((milestone) => ({
      organizationId: organization.id,
      templateId: template.id,
      ...milestone,
    })),
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
