import { NextResponse } from "next/server";
import { QUARTAS_PELADA_2026_ISO } from "@/data/quartas-pelada-2026";
import { seedQuartasPelada2026Db } from "@/lib/gols-db";
import { requireAdminOr401 } from "@/lib/require-admin-api";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno";
}

/** Cadastra em massa as quartas 25/03/2026–30/12/2026 (apenas datas ainda inexistentes). */
export async function POST() {
  try {
    const denied = await requireAdminOr401();
    if (denied) return denied;

    const { inseridas } = await seedQuartasPelada2026Db();
    return NextResponse.json({
      inseridas,
      totalNoCalendario: QUARTAS_PELADA_2026_ISO.length,
      mensagem:
        inseridas === 0
          ? "Nenhuma data nova (todas já estavam cadastradas)."
          : `${inseridas} pelada(s) adicionada(s).`,
    });
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/peladas/seed] POST", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao cadastrar calendário", detalhe: mensagem },
      { status: 500 }
    );
  }
}
