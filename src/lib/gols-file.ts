import fs from "fs/promises";
import path from "path";
import type { GolsRecord } from "@/types/gols";
import {
  lerGolsDb,
  salvarGolsDb,
  tursoDisponivel
} from "@/lib/gols-db";

const filePath = path.join(process.cwd(), "data", "gols.json");

async function lerGolsArquivo(): Promise<GolsRecord> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as GolsRecord;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return {};
    throw err;
  }
}

async function salvarGolsArquivo(gols: GolsRecord): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(gols, null, 2), "utf-8");
}

export async function lerGols(): Promise<GolsRecord> {
  if (tursoDisponivel()) return lerGolsDb();
  return lerGolsArquivo();
}

export async function salvarGols(gols: GolsRecord): Promise<void> {
  if (tursoDisponivel()) {
    await salvarGolsDb(gols);
    return;
  }
  await salvarGolsArquivo(gols);
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
