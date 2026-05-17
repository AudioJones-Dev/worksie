import type { Config } from "drizzle-kit";

// Drizzle is the schema source of truth. `drizzle-kit generate` emits SQL
// into ../../supabase/migrations/ which the Supabase CLI then applies.
// Phase 1 ships zero migrations — schema lands in Phase 2.
export default {
  schema: "./src/schema/index.ts",
  out: "../../supabase/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  strict: true,
  verbose: true
} satisfies Config;
