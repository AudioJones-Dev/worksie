// These arrays are the source of truth for the PostgreSQL enum types
// (see packages/db/src/schema/enums.ts). A change here becomes a Drizzle diff
// and then a migration, so the invariants below guard the mirror contract:
// duplicates or a reordering would produce SQL that is hard to reverse once
// applied.

import { describe, expect, it } from "vitest";

import {
  ARTIFACT_PROCESSING_STATUSES,
  CONTRACTOR_DOCUMENT_STATUSES,
  ENTITY_NAMES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  PAYOUT_PERIOD_STATUSES,
  PAYOUT_RULE_MODES,
  PROOF_OF_WORK_KINDS,
  SYNC_CLASSES,
  TERMINAL_WORK_ORDER_STATES,
  WORK_ORDER_EVENT_SOURCES,
  WORK_ORDER_STATES
} from "./index";

const ALL_ENUMS = {
  ENTITY_NAMES,
  WORK_ORDER_STATES,
  TERMINAL_WORK_ORDER_STATES,
  WORK_ORDER_EVENT_SOURCES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  CONTRACTOR_DOCUMENT_STATUSES,
  PAYOUT_RULE_MODES,
  PAYOUT_PERIOD_STATUSES,
  PROOF_OF_WORK_KINDS,
  ARTIFACT_PROCESSING_STATUSES,
  SYNC_CLASSES
} as const;

describe("domain enum hygiene", () => {
  it.each(Object.entries(ALL_ENUMS))("%s has no duplicates", (_name, values) => {
    expect(new Set(values).size).toBe(values.length);
  });

  it.each(Object.entries(ALL_ENUMS))("%s is non-empty", (_name, values) => {
    expect(values.length).toBeGreaterThan(0);
  });

  // Only these arrays are mirrored into PostgreSQL enum types by
  // packages/db/src/schema/enums.ts. ENTITY_NAMES is PascalCase by design and
  // SYNC_CLASSES is a docs-facing label set; neither reaches SQL.
  const PG_MIRRORED = [
    WORK_ORDER_STATES,
    WORK_ORDER_EVENT_SOURCES,
    MEMBERSHIP_ROLES,
    MEMBERSHIP_STATUSES,
    CONTRACTOR_DOCUMENT_STATUSES,
    PAYOUT_RULE_MODES,
    PAYOUT_PERIOD_STATUSES,
    PROOF_OF_WORK_KINDS,
    ARTIFACT_PROCESSING_STATUSES
  ] as const;

  it("uses snake_case for every value that becomes a PostgreSQL enum label", () => {
    for (const values of PG_MIRRORED) {
      for (const value of values) {
        expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });
});

describe("work order lifecycle", () => {
  it("declares 21 canonical entities", () => {
    // Matches docs/DOMAIN_MODEL.md and the 21 tables in packages/db.
    expect(ENTITY_NAMES).toHaveLength(21);
  });

  it("treats every terminal state as a real work order state", () => {
    for (const state of TERMINAL_WORK_ORDER_STATES) {
      expect(WORK_ORDER_STATES).toContain(state);
    }
  });

  it("keeps draft as the first state and leaves it non-terminal", () => {
    expect(WORK_ORDER_STATES[0]).toBe("draft");
    expect(TERMINAL_WORK_ORDER_STATES).not.toContain("draft");
  });

  it("marks paid_out, cancelled and voided terminal", () => {
    expect([...TERMINAL_WORK_ORDER_STATES].sort()).toEqual([
      "cancelled",
      "paid_out",
      "voided"
    ]);
  });
});

describe("proof of work", () => {
  it("supports audio capture", () => {
    // Added in Phase 3.5. Removing it would need an enum migration, so this
    // guards against an accidental revert of the domain array.
    expect(PROOF_OF_WORK_KINDS).toContain("audio");
  });

  it("orders upload states from pending through to a terminal outcome", () => {
    expect(ARTIFACT_PROCESSING_STATUSES[0]).toBe("pending");
    expect(ARTIFACT_PROCESSING_STATUSES).toContain("stored");
    expect(ARTIFACT_PROCESSING_STATUSES).toContain("failed");
  });
});

describe("sync classes", () => {
  it("declares exactly the four classes in OFFLINE_FIRST_ARCHITECTURE.md", () => {
    expect(SYNC_CLASSES).toEqual([
      "A_reference",
      "B_assigned",
      "C_append_only",
      "D_server_only"
    ]);
  });
});
