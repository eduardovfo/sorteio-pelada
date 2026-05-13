import type { GolsRecord } from "@/types/gols";
import type {
  DestaquesPelada,
  Pelada,
  PeladaAtualizarDestaquesInput,
  PeladaCriarInput,
  PeladaComRanking,
} from "@/types/pelada";
import type { TursoClient } from "@/lib/turso-client";
import { QUARTAS_PELADA_2026_ISO } from "@/data/quartas-pelada-2026";
import {
  hojeEmFusoPelada,
  isQuartaEmFusoPelada,
  proximaQuartaFeiraDesde,
} from "@/lib/datas-pelada";

const TABLE_PELADAS = "peladas";
const TABLE_GOLS_PELADA = "gols_pelada";
const TABLE_GOLS_LEGACY = "gols";
/** Deltas somados à artilharia geral (GET /api/gols sem peladaId), sem alterar gols por pelada. */
const TABLE_GOLS_GERAL_AJUSTE = "gols_geral_ajuste";

function normalizeDataPelada(s: string): string {
  return s.trim().slice(0, 10);
}

function rowDestaques(r: Record<string, unknown>): DestaquesPelada {
  return {
    craque: (r.craque_nome as string) || null,
    pereba: (r.pereba_nome as string) || null,
    artilheiro: (r.artilheiro_nome as string) || null,
    garcom: (r.garcom_nome as string) || null,
    xerifao: (r.xerifao_nome as string) || null,
    paredao: (r.paredao_nome as string) || null,
    bolaMurcha: (r.bola_murcha_nome as string) || null,
  };
}

function rowToPelada(row: Record<string, unknown>): Pelada {
  return {
    id: Number(row.id ?? 0),
    dataPelada: String(row.data_pelada ?? ""),
    destaques: rowDestaques(row),
  };
}

export async function ensurePeladasSchema(db: TursoClient): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE_PELADAS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pelada TEXT UNIQUE NOT NULL,
      craque_nome TEXT,
      pereba_nome TEXT,
      artilheiro_nome TEXT,
      garcom_nome TEXT,
      xerifao_nome TEXT,
      paredao_nome TEXT,
      bola_murcha_nome TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE_GOLS_PELADA} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pelada_id INTEGER NOT NULL REFERENCES ${TABLE_PELADAS}(id) ON DELETE CASCADE,
      jogador_id INTEGER NOT NULL REFERENCES jogadores(id),
      quantidade INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(pelada_id, jogador_id)
    )`
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_gols_pelada_pelada ON ${TABLE_GOLS_PELADA}(pelada_id)`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE_GOLS_GERAL_AJUSTE} (
      jogador_id INTEGER PRIMARY KEY REFERENCES jogadores(id) ON DELETE CASCADE,
      delta INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  );
}

/**
 * Se hoje (em America/Sao_Paulo) for quarta-feira, garante uma linha em `peladas`
 * para essa data (idempotente).
 */
export async function ensurePeladaHojeSeQuartaComDb(
  db: TursoClient,
  agora: Date = new Date()
): Promise<void> {
  await ensurePeladasSchema(db);
  const hoje = hojeEmFusoPelada(agora);
  if (!isQuartaEmFusoPelada(hoje)) return;
  await db.execute({
    sql: `INSERT OR IGNORE INTO ${TABLE_PELADAS} (data_pelada) VALUES (?)`,
    args: [hoje],
  });
}

/** Copia gols globais antigos para a primeira pelada, se existir histórico sem peladas. */
export async function migrateLegacyGolsIfNeeded(db: TursoClient): Promise<void> {
  const rsCount = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_PELADAS}`,
  });
  const nPeladas = Number((rsCount.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (nPeladas > 0) return;

  const rsGols = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_GOLS_LEGACY} WHERE quantidade > 0`,
  });
  const nGols = Number((rsGols.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (nGols === 0) return;

  const dataPelada = proximaQuartaFeiraDesde(new Date());
  await db.execute({
    sql: `INSERT INTO ${TABLE_PELADAS} (data_pelada) VALUES (?)`,
    args: [dataPelada],
  });
  const rsPid = await db.execute({
    sql: "SELECT last_insert_rowid() AS id",
  });
  const peladaId = Number((rsPid.rows[0] as Record<string, unknown>)?.id ?? 0);
  if (!peladaId) return;

  await db.execute({
    sql: `INSERT INTO ${TABLE_GOLS_PELADA} (pelada_id, jogador_id, quantidade, updated_at)
          SELECT ?, jogador_id, quantidade, updated_at
          FROM ${TABLE_GOLS_LEGACY}
          WHERE quantidade > 0`,
    args: [peladaId],
  });
}

export async function listarPeladasComDb(db: TursoClient): Promise<Pelada[]> {
  const rs = await db.execute({
    sql: `SELECT id, data_pelada, craque_nome, pereba_nome, artilheiro_nome,
                 garcom_nome, xerifao_nome, paredao_nome, bola_murcha_nome
          FROM ${TABLE_PELADAS}
          ORDER BY data_pelada DESC`,
  });
  return rs.rows.map((row) =>
    rowToPelada(row as Record<string, unknown>)
  );
}

/** Lista todas as peladas com ranking de gols daquela noite (ordenado gols ↓, nome). */
export async function listarPeladasComRankingComDb(
  db: TursoClient
): Promise<PeladaComRanking[]> {
  const peladas = await listarPeladasComDb(db);
  if (peladas.length === 0) return [];

  const rs = await db.execute({
    sql: `
      SELECT g.pelada_id AS pelada_id, j.nome AS nome, g.quantidade AS quantidade
      FROM ${TABLE_GOLS_PELADA} g
      JOIN jogadores j ON j.id = g.jogador_id
      WHERE g.quantidade > 0
      ORDER BY g.pelada_id, g.quantidade DESC, j.nome ASC
    `,
  });
  const cols = rs.columns ?? ["pelada_id", "nome", "quantidade"];
  const idxP = cols.indexOf("pelada_id");
  const idxN = cols.indexOf("nome");
  const idxQ = cols.indexOf("quantidade");

  const porPelada = new Map<number, { nome: string; gols: number }[]>();

  for (const row of rs.rows) {
    const r = row as unknown[] | Record<string, unknown>;
    const pid = Number(
      Array.isArray(r)
        ? (idxP >= 0 ? r[idxP] : 0)
        : (r as Record<string, unknown>).pelada_id ?? 0
    );
    const nome = String(
      Array.isArray(r)
        ? (idxN >= 0 ? r[idxN] : "")
        : (r as Record<string, unknown>).nome ?? ""
    );
    const q = Number(
      Array.isArray(r)
        ? (idxQ >= 0 ? r[idxQ] : 0)
        : (r as Record<string, unknown>).quantidade ?? 0
    );
    if (!pid || !nome || Number.isNaN(q) || q <= 0) continue;
    const bucket = porPelada.get(pid) ?? [];
    bucket.push({ nome, gols: Math.floor(q) });
    porPelada.set(pid, bucket);
  }

  return peladas.map((p) => ({
    pelada: p,
    ranking: porPelada.get(p.id) ?? [],
  }));
}

/** Uma pelada pela data ISO (YYYY-MM-DD) com ranking de gols da noite. */
export async function obterPeladaComRankingPorDataComDb(
  db: TursoClient,
  dataISO: string
): Promise<PeladaComRanking | null> {
  const data = normalizeDataPelada(dataISO);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const rsPel = await db.execute({
    sql: `SELECT id, data_pelada, craque_nome, pereba_nome, artilheiro_nome,
                 garcom_nome, xerifao_nome, paredao_nome, bola_murcha_nome
          FROM ${TABLE_PELADAS} WHERE data_pelada = ?`,
    args: [data],
  });
  if (!rsPel.rows.length) return null;

  const p = rowToPelada(rsPel.rows[0] as Record<string, unknown>);
  const rs = await db.execute({
    sql: `
      SELECT j.nome AS nome, g.quantidade AS quantidade
      FROM ${TABLE_GOLS_PELADA} g
      JOIN jogadores j ON j.id = g.jogador_id
      WHERE g.pelada_id = ? AND g.quantidade > 0
      ORDER BY g.quantidade DESC, j.nome ASC
    `,
    args: [p.id],
  });
  const cols = rs.columns ?? ["nome", "quantidade"];
  const idxN = cols.indexOf("nome");
  const idxQ = cols.indexOf("quantidade");
  const ranking: { nome: string; gols: number }[] = [];
  for (const row of rs.rows) {
    const r = row as unknown[] | Record<string, unknown>;
    const nome = String(
      Array.isArray(r)
        ? idxN >= 0
          ? r[idxN]
          : ""
        : (r as Record<string, unknown>).nome ?? ""
    );
    const q = Number(
      Array.isArray(r)
        ? idxQ >= 0
          ? r[idxQ]
          : 0
        : (r as Record<string, unknown>).quantidade ?? 0
    );
    if (!nome || Number.isNaN(q) || q <= 0) continue;
    ranking.push({ nome, gols: Math.floor(q) });
  }

  return { pelada: p, ranking };
}

export async function obterPeladaPorIdComDb(
  db: TursoClient,
  id: number
): Promise<Pelada | null> {
  const rs = await db.execute({
    sql: `SELECT id, data_pelada, craque_nome, pereba_nome, artilheiro_nome,
                 garcom_nome, xerifao_nome, paredao_nome, bola_murcha_nome
          FROM ${TABLE_PELADAS} WHERE id = ?`,
    args: [id],
  });
  if (!rs.rows.length) return null;
  return rowToPelada(rs.rows[0] as Record<string, unknown>);
}

export async function criarPeladaComDb(
  db: TursoClient,
  input: PeladaCriarInput
): Promise<Pelada> {
  const data = normalizeDataPelada(input.dataPelada);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new Error("dataPelada deve estar no formato YYYY-MM-DD.");
  }
  if (!isQuartaEmFusoPelada(data)) {
    throw new Error(
      "Pelada só pode ser criada em quarta-feira (calendário America/Sao_Paulo)."
    );
  }
  const d = input.destaques ?? {};
  await db.execute({
    sql: `INSERT INTO ${TABLE_PELADAS} (
            data_pelada, craque_nome, pereba_nome, artilheiro_nome,
            garcom_nome, xerifao_nome, paredao_nome, bola_murcha_nome
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data,
      d.craque?.trim() || null,
      d.pereba?.trim() || null,
      d.artilheiro?.trim() || null,
      d.garcom?.trim() || null,
      d.xerifao?.trim() || null,
      d.paredao?.trim() || null,
      d.bolaMurcha?.trim() || null,
    ],
  });
  const rsPid = await db.execute({ sql: "SELECT last_insert_rowid() AS id" });
  const id = Number((rsPid.rows[0] as Record<string, unknown>)?.id ?? 0);
  const created = await obterPeladaPorIdComDb(db, id);
  if (!created) throw new Error("Falha ao criar pelada.");
  return created;
}

export async function atualizarDestaquesComDb(
  db: TursoClient,
  id: number,
  patch: PeladaAtualizarDestaquesInput
): Promise<Pelada | null> {
  const atual = await obterPeladaPorIdComDb(db, id);
  if (!atual) return null;
  const m: DestaquesPelada = {
    ...atual.destaques,
    ...patch,
  };
  await db.execute({
    sql: `UPDATE ${TABLE_PELADAS} SET
            craque_nome = ?, pereba_nome = ?, artilheiro_nome = ?,
            garcom_nome = ?, xerifao_nome = ?, paredao_nome = ?, bola_murcha_nome = ?
          WHERE id = ?`,
    args: [
      m.craque?.trim() || null,
      m.pereba?.trim() || null,
      m.artilheiro?.trim() || null,
      m.garcom?.trim() || null,
      m.xerifao?.trim() || null,
      m.paredao?.trim() || null,
      m.bolaMurcha?.trim() || null,
      id,
    ],
  });
  return obterPeladaPorIdComDb(db, id);
}

/** Insere as quartas do calendário 2026 (mar–dez) que ainda não existem. */
export async function seedQuartasPelada2026ComDb(
  db: TursoClient
): Promise<{ inseridas: number }> {
  await ensurePeladasSchema(db);
  const rsAntes = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_PELADAS}`,
  });
  const antes = Number((rsAntes.rows[0] as Record<string, unknown>)?.c ?? 0);

  for (const dataPelada of QUARTAS_PELADA_2026_ISO) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO ${TABLE_PELADAS} (data_pelada) VALUES (?)`,
      args: [dataPelada],
    });
  }

  const rsDepois = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM ${TABLE_PELADAS}`,
  });
  const depois = Number((rsDepois.rows[0] as Record<string, unknown>)?.c ?? 0);
  return { inseridas: depois - antes };
}

export async function lerGolsAgregadosComDb(db: TursoClient): Promise<GolsRecord> {
  const rs = await db.execute({
    sql: `
      SELECT j.nome AS nome,
             (COALESCE(b.soma, 0) + COALESCE(a.delta, 0)) AS quantidade
      FROM jogadores j
      LEFT JOIN (
        SELECT jogador_id, SUM(quantidade) AS soma
        FROM ${TABLE_GOLS_PELADA}
        GROUP BY jogador_id
      ) b ON b.jogador_id = j.id
      LEFT JOIN ${TABLE_GOLS_GERAL_AJUSTE} a ON a.jogador_id = j.id
      WHERE (COALESCE(b.soma, 0) + COALESCE(a.delta, 0)) > 0
    `,
  });
  const cols = rs.columns ?? ["nome", "quantidade"];
  const idxNome = cols.indexOf("nome");
  const idxQtd = cols.indexOf("quantidade");
  const resultado: GolsRecord = {};
  for (const row of rs.rows) {
    const r = row as unknown[] | Record<string, unknown>;
    const nome = String(
      Array.isArray(r)
        ? idxNome >= 0
          ? r[idxNome]
          : ""
        : (r as Record<string, unknown>).nome ?? ""
    );
    const quantidade = Number(
      Array.isArray(r)
        ? idxQtd >= 0
          ? r[idxQtd]
          : 0
        : (r as Record<string, unknown>).quantidade ?? 0
    );
    if (!nome || Number.isNaN(quantidade) || quantidade <= 0) continue;
    resultado[nome] = Math.floor(quantidade);
  }
  return resultado;
}

/**
 * Persiste totais desejados na artilharia geral (soma peladas + ajuste).
 * Não altera linhas em `gols_pelada`; grava apenas `delta` em `gols_geral_ajuste`.
 * Chaves **ausentes** em `golsDesejados` mantêm o total exibido atual do jogador.
 */
export async function salvarGolsGeralAjusteComDb(
  db: TursoClient,
  golsDesejados: Record<string, number>
): Promise<void> {
  await ensurePeladasSchema(db);

  const rsBase = await db.execute({
    sql: `
      SELECT j.id AS jogador_id, j.nome AS nome,
             COALESCE(b.soma, 0) AS soma,
             COALESCE(a.delta, 0) AS delta_atual
      FROM jogadores j
      LEFT JOIN (
        SELECT jogador_id, SUM(quantidade) AS soma
        FROM ${TABLE_GOLS_PELADA}
        GROUP BY jogador_id
      ) b ON b.jogador_id = j.id
      LEFT JOIN ${TABLE_GOLS_GERAL_AJUSTE} a ON a.jogador_id = j.id
    `,
  });
  const cols = rsBase.columns ?? ["jogador_id", "nome", "soma", "delta_atual"];
  const idxId = cols.indexOf("jogador_id");
  const idxNome = cols.indexOf("nome");
  const idxSoma = cols.indexOf("soma");
  const idxDelta = cols.indexOf("delta_atual");

  for (const row of rsBase.rows) {
    const r = row as unknown[] | Record<string, unknown>;
    const id = readPositiveIntFromRow(r, idxId, "jogador_id");
    const nome = String(
      Array.isArray(r)
        ? idxNome >= 0
          ? r[idxNome]
          : ""
        : (r as Record<string, unknown>).nome ?? ""
    ).trim();
    if (!id || !nome) continue;

    const soma = Number(
      Array.isArray(r)
        ? idxSoma >= 0
          ? r[idxSoma]
          : 0
        : (r as Record<string, unknown>).soma ?? 0
    );
    const baseSoma = Number.isFinite(soma) ? Math.floor(soma) : 0;

    const deltaAtual = Number(
      Array.isArray(r)
        ? idxDelta >= 0
          ? r[idxDelta]
          : 0
        : (r as Record<string, unknown>).delta_atual ?? 0
    );
    const deltaAjuste = Number.isFinite(deltaAtual) ? Math.floor(deltaAtual) : 0;

    const totalAtual = baseSoma + deltaAjuste;
    const hasExplicit = Object.prototype.hasOwnProperty.call(
      golsDesejados,
      nome
    );
    const desejadoFinal = hasExplicit
      ? Math.max(0, Math.floor(Number(golsDesejados[nome]) || 0))
      : totalAtual;

    const delta = desejadoFinal - baseSoma;

    if (delta === 0) {
      await db.execute({
        sql: `DELETE FROM ${TABLE_GOLS_GERAL_AJUSTE} WHERE jogador_id = ?`,
        args: [id],
      });
    } else {
      await db.execute({
        sql: `
          INSERT INTO ${TABLE_GOLS_GERAL_AJUSTE} (jogador_id, delta, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(jogador_id) DO UPDATE SET
            delta = excluded.delta,
            updated_at = excluded.updated_at
        `,
        args: [id, delta],
      });
    }
  }
}

function readPositiveIntFromRow(
  r: unknown[] | Record<string, unknown>,
  idxId: number,
  idKey: string
): number {
  let raw: unknown;
  if (Array.isArray(r)) {
    raw = idxId >= 0 ? r[idxId] : undefined;
  } else {
    raw = (r as Record<string, unknown>)[idKey];
  }
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function lerGolsPorPeladaComDb(
  db: TursoClient,
  peladaId: number
): Promise<GolsRecord> {
  const rs = await db.execute({
    sql: `
      SELECT j.nome AS nome, g.quantidade AS quantidade
      FROM ${TABLE_GOLS_PELADA} g
      JOIN jogadores j ON j.id = g.jogador_id
      WHERE g.pelada_id = ? AND g.quantidade > 0
    `,
    args: [peladaId],
  });
  const cols = rs.columns ?? ["nome", "quantidade"];
  const idxNome = cols.indexOf("nome");
  const idxQtd = cols.indexOf("quantidade");
  const resultado: GolsRecord = {};
  for (const row of rs.rows) {
    const r = row as unknown[] | Record<string, unknown>;
    const nome = String(
      Array.isArray(r)
        ? idxNome >= 0
          ? r[idxNome]
          : ""
        : (r as Record<string, unknown>).nome ?? ""
    );
    const quantidade = Number(
      Array.isArray(r)
        ? idxQtd >= 0
          ? r[idxQtd]
          : 0
        : (r as Record<string, unknown>).quantidade ?? 0
    );
    if (!nome || Number.isNaN(quantidade) || quantidade <= 0) continue;
    resultado[nome] = Math.floor(quantidade);
  }
  return resultado;
}

export async function salvarGolsPorPeladaComDb(
  db: TursoClient,
  peladaId: number,
  gols: GolsRecord
): Promise<void> {
  const exists = await obterPeladaPorIdComDb(db, peladaId);
  if (!exists) throw new Error("Pelada não encontrada.");

  for (const [nome, valor] of Object.entries(gols)) {
    const quantidade = Math.max(0, Math.floor(Number(valor) || 0));
    if (!nome.trim()) continue;

    await db.execute({
      sql: `
        INSERT INTO jogadores (nome)
        VALUES (?)
        ON CONFLICT(nome) DO NOTHING
      `,
      args: [nome.trim()],
    });

    const rsId = await db.execute({
      sql: `SELECT id FROM jogadores WHERE nome = ?`,
      args: [nome.trim()],
    });
    if (!rsId.rows.length) continue;
    const jogadorId = Number((rsId.rows[0] as Record<string, unknown>).id ?? 0);
    if (!jogadorId || Number.isNaN(jogadorId)) continue;

    if (quantidade > 0) {
      await db.execute({
        sql: `
          INSERT INTO ${TABLE_GOLS_PELADA} (pelada_id, jogador_id, quantidade, updated_at)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(pelada_id, jogador_id) DO UPDATE SET quantidade = excluded.quantidade, updated_at = excluded.updated_at
        `,
        args: [peladaId, jogadorId, quantidade],
      });
    } else {
      await db.execute({
        sql: `DELETE FROM ${TABLE_GOLS_PELADA} WHERE pelada_id = ? AND jogador_id = ?`,
        args: [peladaId, jogadorId],
      });
    }
  }
}
