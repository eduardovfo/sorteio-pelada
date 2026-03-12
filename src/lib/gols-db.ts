import { createClient } from "@libsql/client";
import type { GolsRecord } from "@/types/gols";

const TABLE_JOGADORES = "jogadores";
const TABLE_GOLS = "gols";

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

async function ensureSchema(db: ReturnType<typeof createClient>) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE_JOGADORES} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE_GOLS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_id INTEGER NOT NULL REFERENCES ${TABLE_JOGADORES}(id),
      quantidade INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(jogador_id)
    )`
  );
}

export async function lerGolsDb(): Promise<GolsRecord> {
  const db = getClient();
  if (!db) {
    throw new Error(
      "Turso não configurado. Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN."
    );
  }

  await ensureSchema(db);
  const rs = await db.execute({
    sql: `
      SELECT j.nome AS nome, g.quantidade AS quantidade
      FROM ${TABLE_JOGADORES} j
      JOIN ${TABLE_GOLS} g ON g.jogador_id = j.id
      WHERE g.quantidade > 0
    `,
  });

  const resultado: GolsRecord = {};
  for (const row of rs.rows as Array<Record<string, unknown>>) {
    const nome = String(row.nome ?? "");
    const quantidade = Number(row.quantidade ?? 0);
    if (!nome || Number.isNaN(quantidade) || quantidade <= 0) continue;
    resultado[nome] = Math.floor(quantidade);
  }

  return resultado;
}

export async function salvarGolsDb(gols: GolsRecord): Promise<void> {
  const db = getClient();
  if (!db) {
    throw new Error(
      "Turso não configurado. Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN."
    );
  }

  await ensureSchema(db);

  // Atualiza ou cria jogadores e seus gols usando o modelo relacional.
  for (const [nome, valor] of Object.entries(gols)) {
    const quantidade = Math.max(0, Math.floor(Number(valor) || 0));
    if (!nome.trim()) continue;

    // Garante que o jogador existe
    await db.execute({
      sql: `
        INSERT INTO ${TABLE_JOGADORES} (nome)
        VALUES (?)
        ON CONFLICT(nome) DO NOTHING
      `,
      args: [nome.trim()],
    });

    const rsId = await db.execute({
      sql: `SELECT id FROM ${TABLE_JOGADORES} WHERE nome = ?`,
      args: [nome.trim()],
    });
    if (!rsId.rows.length) continue;
    const jogadorId = Number(
      (rsId.rows[0] as Record<string, unknown>).id ?? 0
    );
    if (!jogadorId || Number.isNaN(jogadorId)) continue;

    if (quantidade > 0) {
      await db.execute({
        sql: `
          INSERT INTO ${TABLE_GOLS} (jogador_id, quantidade, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(jogador_id)
          DO UPDATE SET quantidade = excluded.quantidade, updated_at = excluded.updated_at
        `,
        args: [jogadorId, quantidade],
      });
    } else {
      // Zera/remover gols quando quantidade for 0
      await db.execute({
        sql: `DELETE FROM ${TABLE_GOLS} WHERE jogador_id = ?`,
        args: [jogadorId],
      });
    }
  }
}
