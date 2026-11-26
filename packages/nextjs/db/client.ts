import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | undefined;

export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 });
  return drizzle(pool);
}

export async function closeDatabase() {
  await pool?.end();
  pool = undefined;
}
