import { NextResponse } from "next/server";
import {
  listarPeladasComRankingDb,
  obterPeladaComRankingPorDataDb,
} from "@/lib/gols-db";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno";
}

/**
 * Com `?data=YYYY-MM-DD`: uma pelada com destaques e ranking da noite.
 * Sem query: lista completa (uso legado; prefira data na UI).
 */
export async function GET(request: Request) {
  try {
    const data = new URL(request.url).searchParams.get("data")?.trim();
    if (data) {
      const item = await obterPeladaComRankingPorDataDb(data);
      if (!item) {
        return NextResponse.json(
          { erro: "Nenhuma pelada cadastrada para esta data." },
          { status: 404 }
        );
      }
      return NextResponse.json(item);
    }
    const lista = await listarPeladasComRankingDb();
    return NextResponse.json(lista);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/peladas/resumo] GET", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao carregar resumo das peladas", detalhe: mensagem },
      { status: 500 }
    );
  }
}
