import { NextResponse } from "next/server";
import type { Jogador } from "@/types/sorteio";
import { seedJogadoresDb } from "@/lib/gols-db";
import { SEED_JOGADORES } from "@/data/seed-jogadores";

/** GET: popula o banco com a lista inicial (basta acessar a URL uma vez). */
export async function GET() {
  try {
    await seedJogadoresDb(SEED_JOGADORES);
    return NextResponse.json({
      ok: true,
      total: SEED_JOGADORES.length,
      mensagem: "Lista inicial de jogadores importada.",
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao importar lista inicial" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { erro: "Payload deve ser um array de jogadores" },
        { status: 400 }
      );
    }

    const jogadores: Jogador[] = [];
    for (const item of body) {
      if (item && typeof item === "object" && typeof (item as Jogador).nome === "string") {
        const j = item as Jogador;
        jogadores.push({
          nome: j.nome,
          ZAG: Math.max(0, Math.min(10, Number(j.ZAG) || 0)),
          MEI: Math.max(0, Math.min(10, Number(j.MEI) || 0)),
          ATA: Math.max(0, Math.min(10, Number(j.ATA) || 0)),
        });
      }
    }

    await seedJogadoresDb(jogadores);
    return NextResponse.json({ ok: true, total: jogadores.length });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao importar jogadores" },
      { status: 500 }
    );
  }
}
