import { NextResponse } from "next/server";
import type { GolsRecord } from "@/types/gols";
import { lerGols, salvarGols } from "@/lib/gols-file";

export async function GET() {
  try {
    const gols = await lerGols();
    return NextResponse.json(gols);
  } catch {
    return NextResponse.json(
      { erro: "Erro ao ler gols" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GolsRecord;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });
    }
    const gols: GolsRecord = {};
    for (const [nome, valor] of Object.entries(body)) {
      const n = Number(valor);
      if (typeof nome === "string" && !Number.isNaN(n) && n >= 0) {
        gols[nome] = Math.floor(n);
      }
    }
    await salvarGols(gols);
    // Sempre devolve a visão atual do banco (modelo relacional)
    const atualizados = await lerGols();
    return NextResponse.json(atualizados);
  } catch {
    return NextResponse.json(
      { erro: "Erro ao salvar gols" },
      { status: 500 }
    );
  }
}
