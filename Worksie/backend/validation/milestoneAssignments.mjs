export function validateMilestoneAssignmentSplits(assignments) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return ['At least one milestone assignment is required.'];
  }

  const errors = [];
  let total = 0;

  assignments.forEach((assignment, index) => {
    const split = Number(assignment.splitPercentage);

    if (!Number.isFinite(split)) {
      errors.push(`assignments[${index}].splitPercentage must be numeric.`);
      return;
    }

    if (split <= 0 || split > 100) {
      errors.push(`assignments[${index}].splitPercentage must be greater than 0 and at most 100.`);
    }

    total += split;
  });

  if (total > 100) {
    errors.push('Milestone assignment split total cannot exceed 100 percent.');
  }

  return errors;
}
