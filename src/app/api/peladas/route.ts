import { NextResponse } from "next/server";
import { listarPeladasDb } from "@/lib/gols-db";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno";
}

export async function GET() {
  try {
    const lista = await listarPeladasDb();
    return NextResponse.json(lista);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/peladas] GET", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao listar peladas", detalhe: mensagem },
      { status: 500 }
    );
  }
}

/** Criação manual desabilitada: a pelada do dia é criada ao listar, nas quartas (America/Sao_Paulo). */
export async function POST() {
  return NextResponse.json(
    {
      erro:
        "Criação manual de pelada desabilitada. Em dia de pelada (quarta, Brasil), ela é criada automaticamente ao abrir a lista.",
    },
    { status: 403 }
  );
}
