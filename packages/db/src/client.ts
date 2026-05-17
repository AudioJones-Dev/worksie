import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Phase 1: minimal client factory. Phase 2 will pass the schema and wire
// RLS-aware Supabase auth context. The factory takes the connection URL
// explicitly so the package never reaches into process.env directly.
export function createDbClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, { prepare: false });
  return drizzle(queryClient);
}

export type DbClient = ReturnType<typeof createDbClient>;
