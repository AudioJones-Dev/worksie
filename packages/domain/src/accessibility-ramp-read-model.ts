import type {
  ContractorDocumentStatus,
  MembershipRole,
  MembershipStatus,
  PayoutRuleMode,
  ProofOfWorkKind,
  WorkOrderState
} from "./index";

type IsoDateTime = string;

export type RampComplianceRequirement = {
  readonly documentType: string;
  readonly status: ContractorDocumentStatus;
  readonly gating: boolean;
  readonly expiresOn?: IsoDateTime;
};

export type RampChecklistStepFixture = {
  readonly id: string;
  readonly label: string;
  readonly ordinal: number;
  readonly requiresPhoto: boolean;
  readonly requiresSignature: boolean;
  readonly completedAt?: IsoDateTime;
};

export type RampLineItemFixture = {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unit: string;
  readonly pieceRateAmount: number;
  readonly completedAt?: IsoDateTime;
};

export type RampInstallFixture = {
  readonly tenant: {
    readonly id: string;
    readonly name: string;
    readonly timezone: string;
  };
  readonly businessProfile: {
    readonly id: string;
    readonly tenantId: string;
    readonly legalName: string;
    readonly dba: string;
    readonly jurisdictions: readonly string[];
  };
  readonly serviceDefinition: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly category: "ramp_install";
    readonly requiredGear: readonly string[];
    readonly requiredDocuments: readonly string[];
    readonly requiredSafetySteps: readonly string[];
    readonly checklistTemplateId: string;
    readonly customerSignoffRequired: boolean;
    readonly defaultPayoutRuleId: string;
  };
  readonly payoutRule: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly mode: PayoutRuleMode;
  };
  readonly checklistTemplate: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly steps: readonly RampChecklistStepFixture[];
  };
  readonly customer: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly address: string;
  };
  readonly contractorMembership: {
    readonly id: string;
    readonly tenantId: string;
    readonly displayName: string;
    readonly role: Extract<MembershipRole, "contractor">;
    readonly status: MembershipStatus;
  };
  readonly complianceRequirements: readonly RampComplianceRequirement[];
  readonly safetyAcknowledgements: readonly string[];
  readonly workOrder: {
    readonly id: string;
    readonly tenantId: string;
    readonly serviceDefinitionId: string;
    readonly customerId: string;
    readonly assignedContractorMembershipId: string;
    readonly status: WorkOrderState;
    readonly scheduledFor: IsoDateTime;
    readonly address: string;
    readonly serviceSnapshot: {
      readonly serviceName: string;
      readonly requiredGear: readonly string[];
      readonly requiredDocuments: readonly string[];
      readonly requiredSafetySteps: readonly string[];
      readonly customerSignoffRequired: boolean;
      readonly payoutRuleName: string;
    };
  };
  readonly lineItems: readonly RampLineItemFixture[];
};

export type RampProofRequirement = {
  readonly checklistStepId: string;
  readonly checklistLabel: string;
  readonly kinds: readonly ProofOfWorkKind[];
  readonly satisfied: boolean;
};

export type AccessibilityRampWorkOrderReadModel = {
  readonly tenantId: string;
  readonly business: {
    readonly name: string;
    readonly jurisdictions: readonly string[];
  };
  readonly serviceDefinition: {
    readonly id: string;
    readonly name: string;
    readonly category: "ramp_install";
    readonly requiredGear: readonly string[];
    readonly requiredDocuments: readonly string[];
    readonly requiredSafetySteps: readonly string[];
  };
  readonly workOrder: {
    readonly id: string;
    readonly status: WorkOrderState;
    readonly scheduledFor: IsoDateTime;
    readonly address: string;
  };
  readonly customer: {
    readonly id: string;
    readonly name: string;
    readonly address: string;
  };
  readonly assignedContractor: {
    readonly id: string;
    readonly displayName: string;
    readonly dispatchable: boolean;
  };
  readonly compliance: {
    readonly dispatchGate: "green" | "blocked";
    readonly requirements: readonly RampComplianceRequirement[];
    readonly safetyAcknowledgements: readonly string[];
  };
  readonly checklist: readonly RampChecklistStepFixture[];
  readonly proofRequirements: readonly RampProofRequirement[];
  readonly signoff: {
    readonly required: boolean;
    readonly captured: boolean;
  };
  readonly lineItems: readonly RampLineItemFixture[];
  readonly payoutReadiness: {
    readonly marker: "not_ready" | "evidence_ready";
    readonly automation: "not_started";
    readonly canGeneratePayoutLines: false;
  };
};

const tenantId = "tenant_accessibility_ramp_demo";

export const accessibilityRampInstallFixture = {
  tenant: {
    id: tenantId,
    name: "Worksie Ramp Demo Tenant",
    timezone: "America/New_York"
  },
  businessProfile: {
    id: "business_profile_ramp_demo",
    tenantId,
    legalName: "Worksie Ramp Demo LLC",
    dba: "Worksie Ramp Demo",
    jurisdictions: ["Florida", "Pinellas County"]
  },
  serviceDefinition: {
    id: "service_accessibility_ramp_install",
    tenantId,
    name: "Accessibility Ramp Install",
    category: "ramp_install",
    requiredGear: [
      "ramp sections",
      "handrails",
      "anchors",
      "hammer drill",
      "levels",
      "PPE"
    ],
    requiredDocuments: ["w9", "coi", "state_or_county_license"],
    requiredSafetySteps: [
      "heavy_lifting",
      "electrical_exposure_check",
      "heat_hydration"
    ],
    checklistTemplateId: "checklist_template_ramp_install",
    customerSignoffRequired: true,
    defaultPayoutRuleId: "payout_rule_ramp_piece_rate"
  },
  payoutRule: {
    id: "payout_rule_ramp_piece_rate",
    tenantId,
    name: "Ramp install piece-rate",
    mode: "piece_rate"
  },
  checklistTemplate: {
    id: "checklist_template_ramp_install",
    tenantId,
    name: "Accessibility ramp install checklist",
    steps: [
      {
        id: "step_verify_site",
        label: "Verify site access and measurements",
        ordinal: 1,
        requiresPhoto: true,
        requiresSignature: false
      },
      {
        id: "step_stage_sections",
        label: "Stage ramp sections and safety equipment",
        ordinal: 2,
        requiresPhoto: true,
        requiresSignature: false
      },
      {
        id: "step_anchor_ramp",
        label: "Install and anchor ramp",
        ordinal: 3,
        requiresPhoto: true,
        requiresSignature: false
      },
      {
        id: "step_install_handrails",
        label: "Install handrails",
        ordinal: 4,
        requiresPhoto: true,
        requiresSignature: false
      },
      {
        id: "step_capture_final_photos",
        label: "Capture final photos",
        ordinal: 5,
        requiresPhoto: true,
        requiresSignature: false
      },
      {
        id: "step_customer_signoff",
        label: "Collect customer sign-off",
        ordinal: 6,
        requiresPhoto: false,
        requiresSignature: true
      }
    ]
  },
  customer: {
    id: "customer_ramp_demo",
    tenantId,
    name: "Jordan Smith",
    address: "100 Example Way, Clearwater, FL"
  },
  contractorMembership: {
    id: "membership_contractor_ramp_demo",
    tenantId,
    displayName: "Taylor Installer",
    role: "contractor",
    status: "active"
  },
  complianceRequirements: [
    {
      documentType: "w9",
      status: "verified",
      gating: true
    },
    {
      documentType: "coi",
      status: "verified",
      gating: true,
      expiresOn: "2026-12-31T23:59:59.000Z"
    },
    {
      documentType: "state_or_county_license",
      status: "verified",
      gating: true,
      expiresOn: "2026-12-31T23:59:59.000Z"
    }
  ],
  safetyAcknowledgements: [
    "heavy_lifting",
    "electrical_exposure_check",
    "heat_hydration"
  ],
  workOrder: {
    id: "work_order_ramp_demo",
    tenantId,
    serviceDefinitionId: "service_accessibility_ramp_install",
    customerId: "customer_ramp_demo",
    assignedContractorMembershipId: "membership_contractor_ramp_demo",
    status: "in_progress",
    scheduledFor: "2026-07-06T13:00:00.000Z",
    address: "100 Example Way, Clearwater, FL",
    serviceSnapshot: {
      serviceName: "Accessibility Ramp Install",
      requiredGear: [
        "ramp sections",
        "handrails",
        "anchors",
        "hammer drill",
        "levels",
        "PPE"
      ],
      requiredDocuments: ["w9", "coi", "state_or_county_license"],
      requiredSafetySteps: [
        "heavy_lifting",
        "electrical_exposure_check",
        "heat_hydration"
      ],
      customerSignoffRequired: true,
      payoutRuleName: "Ramp install piece-rate"
    }
  },
  lineItems: [
    {
      id: "line_item_ramp_sections",
      description: "Ramp sections installed",
      quantity: 3,
      unit: "each",
      pieceRateAmount: 125
    },
    {
      id: "line_item_handrails",
      description: "Handrails installed",
      quantity: 2,
      unit: "each",
      pieceRateAmount: 75
    }
  ]
} as const satisfies RampInstallFixture;

export function createAccessibilityRampInstallReadModel(
  fixture: RampInstallFixture = accessibilityRampInstallFixture
): AccessibilityRampWorkOrderReadModel {
  assertSingleTenantFixture(fixture);

  const proofRequirements = fixture.checklistTemplate.steps
    .filter((step) => step.requiresPhoto || step.requiresSignature)
    .map((step) => ({
      checklistStepId: step.id,
      checklistLabel: step.label,
      kinds: [
        ...(step.requiresPhoto ? ["photo" as const] : []),
        ...(step.requiresSignature ? ["signature" as const] : [])
      ],
      satisfied: false
    }));

  const dispatchable =
    fixture.contractorMembership.status === "active" &&
    fixture.complianceRequirements.every(
      (requirement) => !requirement.gating || requirement.status === "verified"
    ) &&
    fixture.serviceDefinition.requiredSafetySteps.every((step) =>
      fixture.safetyAcknowledgements.includes(step)
    );

  return {
    tenantId: fixture.tenant.id,
    business: {
      name: fixture.businessProfile.dba || fixture.businessProfile.legalName,
      jurisdictions: fixture.businessProfile.jurisdictions
    },
    serviceDefinition: {
      id: fixture.serviceDefinition.id,
      name: fixture.serviceDefinition.name,
      category: fixture.serviceDefinition.category,
      requiredGear: fixture.serviceDefinition.requiredGear,
      requiredDocuments: fixture.serviceDefinition.requiredDocuments,
      requiredSafetySteps: fixture.serviceDefinition.requiredSafetySteps
    },
    workOrder: {
      id: fixture.workOrder.id,
      status: fixture.workOrder.status,
      scheduledFor: fixture.workOrder.scheduledFor,
      address: fixture.workOrder.address
    },
    customer: {
      id: fixture.customer.id,
      name: fixture.customer.name,
      address: fixture.customer.address
    },
    assignedContractor: {
      id: fixture.contractorMembership.id,
      displayName: fixture.contractorMembership.displayName,
      dispatchable
    },
    compliance: {
      dispatchGate: dispatchable ? "green" : "blocked",
      requirements: fixture.complianceRequirements,
      safetyAcknowledgements: fixture.safetyAcknowledgements
    },
    checklist: fixture.checklistTemplate.steps,
    proofRequirements,
    signoff: {
      required: fixture.serviceDefinition.customerSignoffRequired,
      captured: false
    },
    lineItems: fixture.lineItems,
    payoutReadiness: {
      marker: "not_ready",
      automation: "not_started",
      canGeneratePayoutLines: false
    }
  };
}

function assertSingleTenantFixture(fixture: RampInstallFixture): void {
  const expectedTenantId = fixture.tenant.id;
  const scopedRows = [
    ["businessProfile", fixture.businessProfile.tenantId],
    ["serviceDefinition", fixture.serviceDefinition.tenantId],
    ["payoutRule", fixture.payoutRule.tenantId],
    ["checklistTemplate", fixture.checklistTemplate.tenantId],
    ["customer", fixture.customer.tenantId],
    ["contractorMembership", fixture.contractorMembership.tenantId],
    ["workOrder", fixture.workOrder.tenantId]
  ] as const;

  for (const [name, rowTenantId] of scopedRows) {
    if (rowTenantId !== expectedTenantId) {
      throw new Error(
        `Ramp install fixture tenant mismatch: ${name} has ${rowTenantId}, expected ${expectedTenantId}`
      );
    }
  }
}
