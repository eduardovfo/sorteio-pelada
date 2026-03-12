import { createClient } from "@libsql/client";
import type { GolsRecord } from "@/types/gols";
import type { Jogador } from "@/types/sorteio";

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
      ZAG INTEGER NOT NULL DEFAULT 0,
      MEI INTEGER NOT NULL DEFAULT 0,
      ATA INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );

  for (const col of ["ZAG", "MEI", "ATA"] as const) {
    try {
      await db.execute(
        `ALTER TABLE ${TABLE_JOGADORES} ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`
      );
    } catch {
      // Coluna já existe (tabela criada com schema novo)
    }
  }

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

  try {
    await ensureSchema(db);
    const rs = await db.execute({
      sql: `
        SELECT j.nome AS nome, g.quantidade AS quantidade
        FROM ${TABLE_JOGADORES} j
        JOIN ${TABLE_GOLS} g ON g.jogador_id = j.id
        WHERE g.quantidade > 0
      `,
    });

    const cols = rs.columns ?? ["nome", "quantidade"];
    const idxNome = cols.indexOf("nome");
    const idxQtd = cols.indexOf("quantidade");
    const resultado: GolsRecord = {};

    for (const row of rs.rows) {
      const r = row as unknown[] | Record<string, unknown>;
      const nome = String(
        Array.isArray(r) ? (idxNome >= 0 ? r[idxNome] : "") : (r as Record<string, unknown>).nome ?? ""
      );
      const quantidade = Number(
        Array.isArray(r) ? (idxQtd >= 0 ? r[idxQtd] : 0) : (r as Record<string, unknown>).quantidade ?? 0
      );
      if (!nome || Number.isNaN(quantidade) || quantidade <= 0) continue;
      resultado[nome] = Math.floor(quantidade);
    }

    return resultado;
  } catch {
    return {};
  }
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

/** Converte linha do resultado (array ou objeto) em Jogador. */
function rowToJogador(
  row: unknown[] | Record<string, unknown>,
  cols?: string[]
): Jogador {
  const get = (key: string) => {
    if (Array.isArray(row) && cols) {
      const i = cols.indexOf(key);
      return i >= 0 ? row[i] : undefined;
    }
    return (row as Record<string, unknown>)[key];
  };
  return {
    nome: String(get("nome") ?? ""),
    ZAG: Math.max(0, Math.min(10, Number(get("ZAG") ?? 0) || 0)),
    MEI: Math.max(0, Math.min(10, Number(get("MEI") ?? 0) || 0)),
    ATA: Math.max(0, Math.min(10, Number(get("ATA") ?? 0) || 0)),
  };
}

/** Lista todos os jogadores do banco (fonte única na Vercel). */
export async function listarJogadoresDb(): Promise<Jogador[]> {
  const db = getClient();
  if (!db) {
    throw new Error(
      "Turso não configurado. Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN."
    );
  }

  await ensureSchema(db);

  try {
    const rs = await db.execute({
      sql: `SELECT nome, ZAG, MEI, ATA FROM ${TABLE_JOGADORES} ORDER BY nome`,
    });
    const cols = rs.columns ?? ["nome", "ZAG", "MEI", "ATA"];
    const lista: Jogador[] = [];
    for (const row of rs.rows) {
      const r = row as unknown[] | Record<string, unknown>;
      lista.push(rowToJogador(r, cols));
    }
    return lista;
  } catch {
    // Fallback: tabela antiga sem ZAG/MEI/ATA — retorna só nome com notas 0
    const rs = await db.execute({
      sql: `SELECT nome FROM ${TABLE_JOGADORES} ORDER BY nome`,
    });
    const cols = rs.columns ?? ["nome"];
    const lista: Jogador[] = [];
    for (const row of rs.rows) {
      const r = row as unknown[] | Record<string, unknown>;
      lista.push(rowToJogador(r, cols));
    }
    return lista;
  }
}

/** Importa/atualiza jogadores (ex.: seed a partir do JSON). */
export async function seedJogadoresDb(jogadores: Jogador[]): Promise<void> {
  const db = getClient();
  if (!db) {
    throw new Error(
      "Turso não configurado. Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN."
    );
  }

  await ensureSchema(db);

  for (const j of jogadores) {
    const nome = String(j.nome ?? "").trim();
    if (!nome) continue;
    const zag = Math.max(0, Math.min(10, Number(j.ZAG) || 0));
    const mei = Math.max(0, Math.min(10, Number(j.MEI) || 0));
    const ata = Math.max(0, Math.min(10, Number(j.ATA) || 0));

    await db.execute({
      sql: `
        INSERT INTO ${TABLE_JOGADORES} (nome, ZAG, MEI, ATA)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(nome) DO UPDATE SET ZAG = excluded.ZAG, MEI = excluded.MEI, ATA = excluded.ATA
      `,
      args: [nome, zag, mei, ata],
    });
  }
}
