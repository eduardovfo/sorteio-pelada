import type { GolsRecord } from "@/types/gols";
import type { Jogador } from "@/types/sorteio";
import type {
  Pelada,
  PeladaAtualizarDestaquesInput,
  PeladaCriarInput,
  PeladaComRanking,
} from "@/types/pelada";
import { getTursoClient, type TursoClient } from "@/lib/turso-client";
import {
  atualizarDestaquesComDb,
  criarPeladaComDb,
  ensurePeladaHojeSeQuartaComDb,
  ensurePeladasSchema,
  lerGolsAgregadosComDb,
  lerGolsPorPeladaComDb,
  listarPeladasComDb,
  listarPeladasComRankingComDb,
  migrateLegacyGolsIfNeeded,
  obterPeladaComRankingPorDataComDb,
  obterPeladaPorIdComDb,
  salvarGolsPorPeladaComDb,
  salvarGolsGeralAjusteComDb,
  seedQuartasPelada2026ComDb,
} from "@/lib/peladas-db";

const TABLE_JOGADORES = "jogadores";
const TABLE_GOLS = "gols";

function requireDb(): TursoClient {
  const db = getTursoClient();
  if (!db) {
    throw new Error(
      "Turso não configurado. Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN."
    );
  }
  return db;
}

async function ensureSchema(db: TursoClient): Promise<void> {
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
      // Coluna já existe
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

  await ensurePeladasSchema(db);
  await migrateLegacyGolsIfNeeded(db);
}

/** Gols somados em todas as peladas (artilharia geral). */
export async function lerGolsDb(): Promise<GolsRecord> {
  const db = requireDb();
  try {
    console.log("[TURSO] Lendo gols agregados (todas as peladas)");
    await ensureSchema(db);
    const resultado = await lerGolsAgregadosComDb(db);
    console.log("[TURSO] Leitura de gols concluída", {
      total: Object.keys(resultado).length,
    });
    return resultado;
  } catch (erro) {
    console.error("[TURSO] Erro ao ler gols do banco", erro);
    return {};
  }
}

/** Gols apenas da pelada informada. */
export async function lerGolsPorPeladaDb(
  peladaId: number
): Promise<GolsRecord> {
  const db = requireDb();
  await ensureSchema(db);
  return lerGolsPorPeladaComDb(db, peladaId);
}

export async function salvarGolsPorPeladaDb(
  peladaId: number,
  gols: GolsRecord
): Promise<void> {
  const db = requireDb();
  console.log("[TURSO] Salvando gols da pelada", {
    peladaId,
    totalJogadores: Object.keys(gols).length,
  });
  await ensureSchema(db);
  await salvarGolsPorPeladaComDb(db, peladaId, gols);
  console.log("[TURSO] Salvamento de gols da pelada concluído");
}

/** Artilharia geral: ajustes em `gols_geral_ajuste` (admin). */
export async function salvarGolsGeralDb(gols: GolsRecord): Promise<GolsRecord> {
  const db = requireDb();
  await ensureSchema(db);
  await salvarGolsGeralAjusteComDb(db, gols);
  return lerGolsAgregadosComDb(db);
}

export async function adicionarGol(
  nome: string,
  peladaId: number
): Promise<GolsRecord> {
  const gols = await lerGolsPorPeladaDb(peladaId);
  gols[nome] = (gols[nome] ?? 0) + 1;
  await salvarGolsPorPeladaDb(peladaId, gols);
  return lerGolsPorPeladaDb(peladaId);
}

export async function removerGol(
  nome: string,
  peladaId: number
): Promise<GolsRecord> {
  const gols = await lerGolsPorPeladaDb(peladaId);
  if (gols[nome] != null && gols[nome] > 0) {
    gols[nome] -= 1;
    await salvarGolsPorPeladaDb(peladaId, gols);
  }
  return lerGolsPorPeladaDb(peladaId);
}

export async function listarPeladasDb(): Promise<Pelada[]> {
  const db = requireDb();
  await ensureSchema(db);
  await ensurePeladaHojeSeQuartaComDb(db);
  return listarPeladasComDb(db);
}

/** Peladas com ranking de gols por noite (para página de artilharia). */
export async function listarPeladasComRankingDb(): Promise<PeladaComRanking[]> {
  const db = requireDb();
  await ensureSchema(db);
  await ensurePeladaHojeSeQuartaComDb(db);
  return listarPeladasComRankingComDb(db);
}

/** Resumo de uma pelada (destaques + ranking) pela data YYYY-MM-DD. */
export async function obterPeladaComRankingPorDataDb(
  dataISO: string
): Promise<PeladaComRanking | null> {
  const db = requireDb();
  await ensureSchema(db);
  await ensurePeladaHojeSeQuartaComDb(db);
  return obterPeladaComRankingPorDataComDb(db, dataISO);
}

export async function obterPeladaDb(id: number): Promise<Pelada | null> {
  const db = requireDb();
  await ensureSchema(db);
  return obterPeladaPorIdComDb(db, id);
}

export async function criarPeladaDb(input: PeladaCriarInput): Promise<Pelada> {
  const db = requireDb();
  await ensureSchema(db);
  return criarPeladaComDb(db, input);
}

export async function atualizarDestaquesPeladaDb(
  id: number,
  patch: PeladaAtualizarDestaquesInput
): Promise<Pelada | null> {
  const db = requireDb();
  await ensureSchema(db);
  return atualizarDestaquesComDb(db, id, patch);
}

/** Cadastra as quartas de mar–dez/2026 que ainda não existem no banco. */
export async function seedQuartasPelada2026Db(): Promise<{ inseridas: number }> {
  const db = requireDb();
  await ensureSchema(db);
  return seedQuartasPelada2026ComDb(db);
}

/** @deprecated Mantido para compat; use salvarGolsPorPeladaDb. */
export async function salvarGolsDb(_gols: GolsRecord): Promise<void> {
  throw new Error(
    "Use salvarGolsPorPeladaDb(peladaId, gols). Gols são por pelada."
  );
}

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

export async function listarJogadoresDb(): Promise<Jogador[]> {
  const db = requireDb();
  await ensureSchema(db);

  try {
    console.log("[TURSO] Listando jogadores do banco");
    const rs = await db.execute({
      sql: `SELECT nome, ZAG, MEI, ATA FROM ${TABLE_JOGADORES} ORDER BY nome`,
    });
    const cols = rs.columns ?? ["nome", "ZAG", "MEI", "ATA"];
    const lista: Jogador[] = [];
    for (const row of rs.rows) {
      const r = row as unknown[] | Record<string, unknown>;
      lista.push(rowToJogador(r, cols));
    }
    console.log("[TURSO] Listagem de jogadores concluída", {
      total: lista.length,
    });
    return lista;
  } catch (erro) {
    console.error(
      "[TURSO] Erro ao listar jogadores, tentando fallback sem ZAG/MEI/ATA",
      erro
    );
    const rs = await db.execute({
      sql: `SELECT nome FROM ${TABLE_JOGADORES} ORDER BY nome`,
    });
    const cols = rs.columns ?? ["nome"];
    const lista: Jogador[] = [];
    for (const row of rs.rows) {
      const r = row as unknown[] | Record<string, unknown>;
      lista.push(rowToJogador(r, cols));
    }
    console.log("[TURSO] Fallback de jogadores concluído", {
      total: lista.length,
    });
    return lista;
  }
}

export async function seedJogadoresDb(jogadores: Jogador[]): Promise<void> {
  const db = requireDb();

  try {
    console.log("[TURSO] Seed de jogadores iniciado", {
      total: jogadores.length,
    });
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
    console.log("[TURSO] Seed de jogadores concluído");
  } catch (erro) {
    console.error("[TURSO] Erro durante seed de jogadores", erro);
    throw erro;
  }
}
