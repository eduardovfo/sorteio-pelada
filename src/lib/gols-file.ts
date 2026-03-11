import fs from "fs/promises";
import path from "path";
import type { GolsRecord } from "@/types/gols";

const filePath = path.join(process.cwd(), "data", "gols.json");

export async function lerGols(): Promise<GolsRecord> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as GolsRecord;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return {};
    throw err;
  }
}

export async function salvarGols(gols: GolsRecord): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(gols, null, 2), "utf-8");
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
