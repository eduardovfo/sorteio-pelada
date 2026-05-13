import { NextResponse } from "next/server";
import type { GolsRecord } from "@/types/gols";
import { salvarGolsGeralDb } from "@/lib/gols-db";
import { requireAdminOr401 } from "@/lib/require-admin-api";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno ao salvar artilharia geral";
}

/**
 * Salva totais da artilharia geral usando ajustes (`gols_geral_ajuste`),
 * sem alterar `gols_pelada`. Apenas admin.
 * Body: `{ gols: Record<nome, number> }` — inclua explicitamente o nome para alterar;
 * jogadores omitidos mantêm o total atual.
 */
export async function POST(request: Request) {
  try {
    const denied = await requireAdminOr401();
    if (denied) return denied;

    const body = (await request.json()) as { gols?: unknown };
    const raw = body.gols;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ erro: "gols inválido" }, { status: 400 });
    }
    const gols: GolsRecord = {};
    for (const [nome, valor] of Object.entries(raw as GolsRecord)) {
      const n = Number(valor);
      if (typeof nome === "string" && nome.trim() && !Number.isNaN(n) && n >= 0) {
        gols[nome.trim()] = Math.floor(n);
      }
    }
    const atualizados = await salvarGolsGeralDb(gols);
    return NextResponse.json(atualizados);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/gols/geral] POST", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao salvar artilharia geral", detalhe: mensagem },
      { status: 500 }
    );
  }
}
