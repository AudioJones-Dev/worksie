import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "./schema/index";

// Phase 2: client factory wired to the canonical schema so query builders
// get inferred row/insert types. The factory takes the connection URL
// explicitly so this package never reaches into process.env directly.
export function createDbClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, { prepare: false });
  return drizzle(queryClient, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
