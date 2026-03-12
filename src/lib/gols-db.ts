import { createClient } from "@libsql/client";
import type { GolsRecord } from "@/types/gols";

const TABLE = "gols_store";
const KEY_GOLS = "gols";

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

async function ensureTable(db: ReturnType<typeof createClient>) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (key TEXT PRIMARY KEY, value TEXT)`
  );
}

export async function lerGolsDb(): Promise<GolsRecord> {
  const db = getClient();
  if (!db) throw new Error("Turso não configurado (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)");

  await ensureTable(db);
  const rs = await db.execute({
    sql: `SELECT value FROM ${TABLE} WHERE key = ?`,
    args: [KEY_GOLS],
  });

  if (rs.rows.length === 0 || rs.rows[0][0] == null) return {};
  try {
    return JSON.parse(rs.rows[0][0] as string) as GolsRecord;
  } catch {
    return {};
  }
}

export async function salvarGolsDb(gols: GolsRecord): Promise<void> {
  const db = getClient();
  if (!db) throw new Error("Turso não configurado");

  await ensureTable(db);
  await db.execute({
    sql: `INSERT OR REPLACE INTO ${TABLE} (key, value) VALUES (?, ?)`,
    args: [KEY_GOLS, JSON.stringify(gols)],
  });
}

export function tursoDisponivel(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  );
}
