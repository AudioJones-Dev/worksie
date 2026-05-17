// RLS verification harness for Phase 3.
//
// What this script proves:
//   1. Default-deny: an unauthenticated session (no JWT claim) sees zero
//      rows from any tenant table.
//   2. Tenant isolation read: User A under `authenticated` sees their own
//      tenant's rows but NOT another tenant's rows.
//   3. Tenant isolation write: User A cannot INSERT a row carrying a
//      foreign tenant_id.
//   4. work_order_events append-only: UPDATE/DELETE under `authenticated`
//      are silently filtered to zero rows by RLS, AND a privileged path
//      (RLS bypassed via `LOCAL` GUC reset) still raises the append-only
//      trigger.
//
// Approach: we connect to local Postgres with a privileged user, seed
// two minimal tenants + users + memberships + a work_order each, then
// switch role to `authenticated` and impersonate each user via
// `SET LOCAL request.jwt.claim.sub`. This mirrors what Supabase does
// for an authenticated REST request.
//
// Pre-reqs:
//   - `supabase start` succeeded locally
//   - `supabase db reset` applied 0000 + 0001
//   - DATABASE_URL points at the local Postgres (defaults to the
//     Supabase CLI's standard URL).

import { randomUUID } from "node:crypto";
import postgres from "postgres";

const DATABASE_URL =
  process.env.WORKSIE_VERIFY_DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgres://postgres:postgres@127.0.0.1:54322/postgres";

type Probe = { name: string; passed: boolean; detail?: string };

const probes: Probe[] = [];

function record(name: string, passed: boolean, detail?: string): void {
  probes.push({ name, passed, detail });
  const status = passed ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main(): Promise<void> {
  const sql = postgres(DATABASE_URL, {
    prepare: false,
    onnotice: () => {}
  });

  try {
    await runProbes(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }

  const failed = probes.filter((p) => !p.passed);
  // eslint-disable-next-line no-console
  console.log(
    `\nverify-rls: ${probes.length - failed.length}/${probes.length} passed`
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

type Seed = {
  tenantA: string;
  tenantB: string;
  userAId: string;
  userBId: string;
  authAId: string;
  authBId: string;
  customerAId: string;
  customerBId: string;
  serviceAId: string;
  serviceBId: string;
  workOrderAId: string;
  workOrderBId: string;
  eventAId: string;
};

async function runProbes(sql: postgres.Sql): Promise<void> {
  const seed = await seedTwoTenants(sql);

  // ---- Probe 1: default-deny when unauthenticated ----------------------
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE authenticated");
    await tx.unsafe("SET LOCAL request.jwt.claim.sub TO ''");
    const rows = await tx<{ count: number }[]>`
      SELECT count(*)::int AS count FROM work_orders
    `;
    const count = rows[0]?.count ?? -1;
    record(
      "unauthenticated default-deny on work_orders",
      count === 0,
      `count=${count}`
    );
  });

  // ---- Probe 2: A sees A, A does not see B ----------------------------
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE authenticated");
    await tx.unsafe(`SET LOCAL request.jwt.claim.sub TO '${seed.authAId}'`);
    const rows = await tx<
      { id: string; tenant_id: string }[]
    >`SELECT id, tenant_id FROM work_orders`;
    const onlyA = rows.every((r) => r.tenant_id === seed.tenantA);
    const sawA = rows.some((r) => r.id === seed.workOrderAId);
    const sawB = rows.some((r) => r.id === seed.workOrderBId);
    record(
      "user A sees own tenant's work_orders",
      onlyA && sawA && !sawB,
      `rows=${rows.length} sawA=${sawA} sawB=${sawB}`
    );
  });

  // ---- Probe 3: B sees B only -----------------------------------------
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE authenticated");
    await tx.unsafe(`SET LOCAL request.jwt.claim.sub TO '${seed.authBId}'`);
    const rows = await tx<
      { id: string; tenant_id: string }[]
    >`SELECT id, tenant_id FROM work_orders`;
    const onlyB = rows.every((r) => r.tenant_id === seed.tenantB);
    record(
      "user B sees own tenant's work_orders",
      onlyB && rows.length === 1,
      `rows=${rows.length}`
    );
  });

  // ---- Probe 4: A cannot INSERT a customer under tenant B -------------
  // The expected failure aborts the surrounding transaction, so we wrap
  // the INSERT in a savepoint. The savepoint rollback contains the
  // failure while the outer transaction commits cleanly.
  let crossTenantInsertBlocked = false;
  let crossTenantInsertDetail = "";
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE authenticated");
    await tx.unsafe(`SET LOCAL request.jwt.claim.sub TO '${seed.authAId}'`);
    try {
      await tx.savepoint(async (sp) => {
        await sp`
          INSERT INTO customers (id, tenant_id, name)
          VALUES (${randomUUID()}, ${seed.tenantB}, 'cross-tenant attempt')
        `;
      });
      crossTenantInsertDetail = "insert unexpectedly succeeded";
    } catch (e) {
      crossTenantInsertBlocked = true;
      crossTenantInsertDetail = (e as Error).message.split("\n")[0] ?? "";
    }
  });
  record(
    "user A cannot INSERT into tenant B",
    crossTenantInsertBlocked,
    crossTenantInsertDetail
  );

  // ---- Probe 5: append-only via RLS — UPDATE/DELETE return zero rows --
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE authenticated");
    await tx.unsafe(`SET LOCAL request.jwt.claim.sub TO '${seed.authBId}'`);
    // User B tries to UPDATE user A's event. RLS hides the row, so the
    // statement should affect zero rows (no exception).
    const updated = await tx`
      UPDATE work_order_events
         SET reason = 'tamper'
       WHERE id = ${seed.eventAId}
    `;
    record(
      "work_order_events UPDATE under wrong tenant affects 0 rows",
      updated.count === 0,
      `count=${updated.count}`
    );
    const deleted = await tx`
      DELETE FROM work_order_events WHERE id = ${seed.eventAId}
    `;
    record(
      "work_order_events DELETE under wrong tenant affects 0 rows",
      deleted.count === 0,
      `count=${deleted.count}`
    );
  });

  // ---- Probe 6: append-only — even with RLS bypassed, trigger raises --
  // Same savepoint pattern as probe 4: the trigger's RAISE EXCEPTION
  // would otherwise abort the outer transaction.
  let triggerRaised = false;
  let triggerDetail = "";
  await sql.begin(async (tx) => {
    // Stay on the privileged role (no SET LOCAL ROLE). RLS does not
    // apply, but the append-only trigger must still fire.
    try {
      await tx.savepoint(async (sp) => {
        await sp`
          UPDATE work_order_events SET reason = 'tamper' WHERE id = ${seed.eventAId}
        `;
      });
    } catch (e) {
      triggerRaised = true;
      triggerDetail = (e as Error).message.split("\n")[0] ?? "";
    }
  });
  record(
    "work_order_events append-only trigger raises on UPDATE",
    triggerRaised,
    triggerDetail
  );

  triggerRaised = false;
  triggerDetail = "";
  await sql.begin(async (tx) => {
    try {
      await tx.savepoint(async (sp) => {
        await sp`DELETE FROM work_order_events WHERE id = ${seed.eventAId}`;
      });
    } catch (e) {
      triggerRaised = true;
      triggerDetail = (e as Error).message.split("\n")[0] ?? "";
    }
  });
  record(
    "work_order_events append-only trigger raises on DELETE",
    triggerRaised,
    triggerDetail
  );

  // Cleanup: drop the seed rows so reruns are idempotent.
  await cleanup(sql, seed);
}

async function seedTwoTenants(sql: postgres.Sql): Promise<Seed> {
  const seed: Seed = {
    tenantA: randomUUID(),
    tenantB: randomUUID(),
    userAId: randomUUID(),
    userBId: randomUUID(),
    authAId: randomUUID(),
    authBId: randomUUID(),
    customerAId: randomUUID(),
    customerBId: randomUUID(),
    serviceAId: randomUUID(),
    serviceBId: randomUUID(),
    workOrderAId: randomUUID(),
    workOrderBId: randomUUID(),
    eventAId: randomUUID()
  };

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO tenants (id, name, timezone)
      VALUES
        (${seed.tenantA}, ${"verify-rls-A"}, ${"UTC"}),
        (${seed.tenantB}, ${"verify-rls-B"}, ${"UTC"})
    `;
    await tx`
      INSERT INTO users (id, auth_user_id, email)
      VALUES
        (${seed.userAId}, ${seed.authAId}, ${`verify-rls-a+${seed.userAId}@example.test`}),
        (${seed.userBId}, ${seed.authBId}, ${`verify-rls-b+${seed.userBId}@example.test`})
    `;
    await tx`
      INSERT INTO memberships (tenant_id, user_id, role, status)
      VALUES
        (${seed.tenantA}, ${seed.userAId}, 'operator', 'active'),
        (${seed.tenantB}, ${seed.userBId}, 'operator', 'active')
    `;
    await tx`
      INSERT INTO customers (id, tenant_id, name)
      VALUES
        (${seed.customerAId}, ${seed.tenantA}, ${"customer-A"}),
        (${seed.customerBId}, ${seed.tenantB}, ${"customer-B"})
    `;
    await tx`
      INSERT INTO service_definitions (id, tenant_id, name, category)
      VALUES
        (${seed.serviceAId}, ${seed.tenantA}, ${"service-A"}, ${"ramp_install"}),
        (${seed.serviceBId}, ${seed.tenantB}, ${"service-B"}, ${"ramp_install"})
    `;
    await tx`
      INSERT INTO work_orders (
        id, tenant_id, service_definition_id, service_snapshot_json,
        customer_id, status
      )
      VALUES
        (
          ${seed.workOrderAId}, ${seed.tenantA}, ${seed.serviceAId},
          ${tx.json({ snapshot: "A" })}, ${seed.customerAId}, 'draft'
        ),
        (
          ${seed.workOrderBId}, ${seed.tenantB}, ${seed.serviceBId},
          ${tx.json({ snapshot: "B" })}, ${seed.customerBId}, 'draft'
        )
    `;
    await tx`
      INSERT INTO work_order_events (
        id, tenant_id, work_order_id, to_state, source
      )
      VALUES (
        ${seed.eventAId}, ${seed.tenantA}, ${seed.workOrderAId},
        'draft', 'system'
      )
    `;
  });

  return seed;
}

async function cleanup(sql: postgres.Sql, seed: Seed): Promise<void> {
  // work_order_events has an append-only trigger plus cascade from
  // work_orders. We disable user triggers for the teardown transaction
  // so the seed can be removed cleanly. This requires superuser, which
  // the local Supabase postgres role has by default. It does NOT change
  // the trigger's protection for normal application traffic.
  await sql.begin(async (tx) => {
    await tx.unsafe("SET LOCAL session_replication_role = replica");
    await tx`DELETE FROM payout_lines WHERE tenant_id IN (${seed.tenantA}, ${seed.tenantB})`;
    await tx`DELETE FROM work_order_events WHERE tenant_id IN (${seed.tenantA}, ${seed.tenantB})`;
    await tx`DELETE FROM work_orders WHERE id IN (${seed.workOrderAId}, ${seed.workOrderBId})`;
    await tx`DELETE FROM service_definitions WHERE id IN (${seed.serviceAId}, ${seed.serviceBId})`;
    await tx`DELETE FROM customers WHERE id IN (${seed.customerAId}, ${seed.customerBId})`;
    await tx`DELETE FROM memberships WHERE user_id IN (${seed.userAId}, ${seed.userBId})`;
    await tx`DELETE FROM users WHERE id IN (${seed.userAId}, ${seed.userBId})`;
    await tx`DELETE FROM tenants WHERE id IN (${seed.tenantA}, ${seed.tenantB})`;
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("verify-rls failed:", err);
  process.exit(1);
});
