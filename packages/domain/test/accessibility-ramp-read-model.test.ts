import {
  accessibilityRampInstallFixture,
  createAccessibilityRampInstallReadModel,
  type RampInstallFixture
} from "../src/accessibility-ramp-read-model";

const readModel = createAccessibilityRampInstallReadModel();

assertEqual(readModel.tenantId, accessibilityRampInstallFixture.tenant.id);
assertEqual(
  readModel.serviceDefinition.name,
  "Accessibility Ramp Install"
);
assertEqual(readModel.serviceDefinition.category, "ramp_install");
assertEqual(readModel.workOrder.status, "in_progress");
assertEqual(readModel.assignedContractor.dispatchable, true);
assertEqual(readModel.compliance.dispatchGate, "green");
assertEqual(readModel.signoff.required, true);
assertEqual(readModel.signoff.captured, false);
assertEqual(readModel.payoutReadiness.marker, "not_ready");
assertEqual(readModel.payoutReadiness.automation, "not_started");
assertEqual(readModel.payoutReadiness.canGeneratePayoutLines, false);

assertDeepEqual(readModel.serviceDefinition.requiredDocuments, [
  "w9",
  "coi",
  "state_or_county_license"
]);
assertDeepEqual(readModel.serviceDefinition.requiredSafetySteps, [
  "heavy_lifting",
  "electrical_exposure_check",
  "heat_hydration"
]);

assertOk(
  readModel.serviceDefinition.requiredGear.includes("ramp sections"),
  "fixture includes ramp install gear"
);
assertOk(
  readModel.checklist.some((step) => step.label === "Install and anchor ramp"),
  "fixture includes ramp installation checklist step"
);
assertOk(
  readModel.proofRequirements.some(
    (requirement) =>
      requirement.checklistStepId === "step_capture_final_photos" &&
      requirement.kinds.includes("photo")
  ),
  "fixture includes photo proof requirement"
);
assertOk(
  readModel.proofRequirements.some(
    (requirement) =>
      requirement.checklistStepId === "step_customer_signoff" &&
      requirement.kinds.includes("signature")
  ),
  "fixture includes signature proof requirement"
);
assertEqual(readModel.lineItems.length, 2);

const mismatchedFixture: RampInstallFixture = {
  ...accessibilityRampInstallFixture,
  workOrder: {
    ...accessibilityRampInstallFixture.workOrder,
    tenantId: "tenant_other"
  }
};

assertThrows(
  () => createAccessibilityRampInstallReadModel(mismatchedFixture),
  /tenant mismatch/
);

function assertEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, received ${actualJson}`);
  }
}

function assertOk(value: boolean, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

function assertThrows(fn: () => unknown, pattern: RegExp): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && pattern.test(error.message)) {
      return;
    }

    throw error;
  }

  throw new Error(`Expected function to throw ${pattern.source}`);
}
