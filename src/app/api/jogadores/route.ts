import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Jogador } from "@/types/sorteio";

const filePath = path.join(process.cwd(), "data", "jogadores.json");

export async function GET() {
  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as Jogador[];
    return NextResponse.json(data);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(
      { erro: "Erro ao ler jogadores" },
      { status: 500 }
    );
  }
}
