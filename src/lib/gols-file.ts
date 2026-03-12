import type { GolsRecord } from "@/types/gols";
import { lerGolsDb, salvarGolsDb } from "@/lib/gols-db";

export async function lerGols(): Promise<GolsRecord> {
  // Sempre usa Turso (SQLite remoto). Se não estiver configurado,
  // as funções de banco lançarão erro explícito.
  return lerGolsDb();
}

export async function salvarGols(gols: GolsRecord): Promise<void> {
  // Persistência unificada apenas no banco Turso.
  await salvarGolsDb(gols);
}

export async function adicionarGol(nome: string): Promise<GolsRecord> {
  const gols = await lerGols();
  gols[nome] = (gols[nome] ?? 0) + 1;
  await salvarGols(gols);
  return gols;
}

export async function removerGol(nome: string): Promise<GolsRecord> {
  const gols = await lerGols();
  if (gols[nome] != null && gols[nome] > 0) {
    gols[nome] -= 1;
    await salvarGols(gols);
  }
  return gols;
}
