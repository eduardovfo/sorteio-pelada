import { NextResponse } from "next/server";
import { removerGol } from "@/lib/gols-file";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno ao remover gol";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nome?: string };
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    if (!nome) {
      return NextResponse.json(
        { erro: "Nome do jogador é obrigatório" },
        { status: 400 }
      );
    }
    const gols = await removerGol(nome);
    return NextResponse.json(gols);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/gols/remover] Erro no POST", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao remover gol", detalhe: mensagem },
      { status: 500 }
    );
  }
}
