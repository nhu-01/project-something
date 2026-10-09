import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Row = Record<string, unknown>;
type Client = { query: (sql: string, params?: unknown[]) => Promise<Row[]> };

// Production: Tiger Data (DATABASE_URL). Local dev without it, or with USE_LOCAL_DB=1: embedded Postgres in .data/.
const g = globalThis as unknown as { __db?: Promise<Client> };

async function connect(): Promise<Client> {
  const url = process.env.DATABASE_URL;
  const local = !url || process.env.USE_LOCAL_DB === "1";
  let client: Client;
  if (local) {
    if (process.env.VERCEL) throw new Error("DATABASE_URL is not set");
    const { PGlite } = await import("@electric-sql/pglite");
    mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
    const db = new PGlite(path.join(process.cwd(), ".data", "pgdata"));
    client = { query: async (sql, params) => (await db.query<Row>(sql, params)).rows };
  } else {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 10000 });
    client = { query: async (sql, params) => (await pool.query(sql, params)).rows };
  }
  const schema = readFileSync(path.join(process.cwd(), "src/lib/server/schema.sql"), "utf8").replace(/--.*$/gm, "");
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) await client.query(stmt);
  if (!local) {
    // Tiger Data: make sightings a hypertable so time-bucketed stats stay fast. Harmless if it already is one.
    await client.query("SELECT create_hypertable('sightings', 'at', if_not_exists => TRUE, migrate_data => TRUE)").catch(() => {});
  }
  return client;
}

export function db(): Promise<Client> {
  return (g.__db ??= connect().catch((e) => { g.__db = undefined; throw e; }));
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await db()).query(sql, params)) as T[];
}
