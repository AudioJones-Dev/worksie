import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templateCode = 'ada-ramp-wilscot-v1';

const milestones = [
  {
    code: 'M1',
    name: 'Mobilization',
    description: 'Load tools, equipment, ramp materials, and verify inventory.',
    percentValue: 12,
    requiresBeforePhoto: true,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: false,
    requiresGps: true,
    sortOrder: 1,
  },
  {
    code: 'M2',
    name: 'Travel / Arrival',
    description: 'Travel to site, arrive, and confirm site readiness.',
    percentValue: 10,
    requiresBeforePhoto: true,
    requiresProgressPhoto: false,
    requiresCompletionPhoto: true,
    requiresVoiceNote: false,
    requiresGps: true,
    sortOrder: 2,
  },
  {
    code: 'M3',
    name: 'Unload / Prep',
    description: 'Unload materials, stage components, measure, and prep site.',
    percentValue: 15,
    requiresBeforePhoto: true,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: false,
    requiresGps: true,
    sortOrder: 3,
  },
  {
    code: 'M4A',
    name: 'Base Layout / Frame Start',
    description: 'Initial structure positioning and layout.',
    percentValue: 10,
    requiresBeforePhoto: true,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 4,
  },
  {
    code: 'M4B',
    name: 'Ramp Body Assembly',
    description: 'Main 30–42 ft ramp build.',
    percentValue: 15,
    requiresBeforePhoto: false,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 5,
  },
  {
    code: 'M4C',
    name: 'Final Ramp Alignment',
    description: 'Stabilized and aligned ramp structure.',
    percentValue: 10,
    requiresBeforePhoto: false,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 6,
  },
  {
    code: 'M5',
    name: 'Compliance / Securement',
    description: 'Hurricane tie-downs, anchors, rails, and security elements.',
    percentValue: 15,
    requiresBeforePhoto: false,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 7,
  },
  {
    code: 'M6',
    name: 'ADA Step / Closure Kits',
    description: 'Step install, closure kits, and finish edges.',
    percentValue: 8,
    requiresBeforePhoto: false,
    requiresProgressPhoto: true,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 8,
  },
  {
    code: 'M7',
    name: 'Final QA / Cleanup',
    description: 'Final photos, cleanup, and QA approval.',
    percentValue: 5,
    requiresBeforePhoto: false,
    requiresProgressPhoto: false,
    requiresCompletionPhoto: true,
    requiresVoiceNote: true,
    requiresGps: true,
    sortOrder: 9,
  },
];

async function main() {
  const percentTotal = milestones.reduce((total, milestone) => total + milestone.percentValue, 0);

  if (percentTotal !== 100) {
    throw new Error(`ADA ramp template milestone percentages must total 100; received ${percentTotal}.`);
  }

  const organization = await prisma.organization.upsert({
    where: { id: 'seed-org-worksie' },
    update: { name: 'Worksie Demo Organization' },
    create: {
      id: 'seed-org-worksie',
      name: 'Worksie Demo Organization',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@worksie.test' },
    update: {
      fullName: 'Worksie Owner',
      role: 'OWNER',
      organizationId: organization.id,
    },
    create: {
      organizationId: organization.id,
      email: 'owner@worksie.test',
      fullName: 'Worksie Owner',
      role: 'OWNER',
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-wilscot' },
    update: {
      name: 'WilScot Demo Client',
      externalRef: 'CLIENT-WILSCOT',
      organizationId: organization.id,
    },
    create: {
      id: 'seed-client-wilscot',
      organizationId: organization.id,
      name: 'WilScot Demo Client',
      externalRef: 'CLIENT-WILSCOT',
    },
  });

  const site = await prisma.site.upsert({
    where: { id: 'seed-site-miami-yard' },
    update: {
      organizationId: organization.id,
      clientId: client.id,
      name: 'Miami Modular Trailer Yard',
      address1: '100 Demo Yard Rd',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'US',
      lat: 25.7617,
      lng: -80.1918,
    },
    create: {
      id: 'seed-site-miami-yard',
      organizationId: organization.id,
      clientId: client.id,
      name: 'Miami Modular Trailer Yard',
      address1: '100 Demo Yard Rd',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'US',
      lat: 25.7617,
      lng: -80.1918,
    },
  });

  const [contractorA, contractorB] = await Promise.all([
    prisma.contractor.upsert({
      where: { id: 'seed-contractor-a' },
      update: {
        organizationId: organization.id,
        displayName: 'Contractor A - Mobilization Crew',
        email: 'contractor.a@worksie.test',
        phone: '+15550001001',
      },
      create: {
        id: 'seed-contractor-a',
        organizationId: organization.id,
        displayName: 'Contractor A - Mobilization Crew',
        email: 'contractor.a@worksie.test',
        phone: '+15550001001',
      },
    }),
    prisma.contractor.upsert({
      where: { id: 'seed-contractor-b' },
      update: {
        organizationId: organization.id,
        displayName: 'Contractor B - Install Crew',
        email: 'contractor.b@worksie.test',
        phone: '+15550001002',
      },
      create: {
        id: 'seed-contractor-b',
        organizationId: organization.id,
        displayName: 'Contractor B - Install Crew',
        email: 'contractor.b@worksie.test',
        phone: '+15550001002',
      },
    }),
  ]);

  const template = await prisma.jobTemplate.upsert({
    where: {
      organizationId_templateCode: {
        organizationId: organization.id,
        templateCode,
      },
    },
    update: {
      name: 'ADA Ramp + Step Install - WilScot Trailer',
      jobType: 'installation',
      billingModel: 'milestone_based',
      requiresPhotoVerification: true,
      requiresQaApproval: true,
      allowsPartialInvoicing: true,
      allowsMultiContractorAssignment: true,
      defaultProrationMethod: 'milestone',
      reworkDeductionsEnabled: true,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      templateCode,
      name: 'ADA Ramp + Step Install - WilScot Trailer',
      jobType: 'installation',
      billingModel: 'milestone_based',
      requiresPhotoVerification: true,
      requiresQaApproval: true,
      allowsPartialInvoicing: true,
      allowsMultiContractorAssignment: true,
      defaultProrationMethod: 'milestone',
      reworkDeductionsEnabled: true,
      isActive: true,
    },
  });

  // Additive: re-running the seed upserts each milestone in `milestones` but
  // does not delete milestones removed from this list. Drop the template (or
  // its milestones) manually if you rename or remove a milestone code.
  await Promise.all(
    milestones.map((milestone) =>
      prisma.templateMilestone.upsert({
        where: {
          templateId_code: {
            templateId: template.id,
            code: milestone.code,
          },
        },
        update: milestone,
        create: {
          templateId: template.id,
          ...milestone,
        },
      }),
    ),
  );

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorUserId: owner.id,
      action: 'SEED_ADA_RAMP_TEMPLATE',
      entityType: 'JobTemplate',
      entityId: template.id,
      afterJson: {
        templateCode,
        milestoneCount: milestones.length,
        percentTotal,
        seededClientId: client.id,
        seededSiteId: site.id,
        seededContractorIds: [contractorA.id, contractorB.id],
      },
    },
  });

  console.log(`Seeded ${template.name} with ${milestones.length} milestones for ${organization.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
