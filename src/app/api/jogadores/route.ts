import { NextResponse } from "next/server";
import { listarJogadoresDb } from "@/lib/gols-db";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno ao listar jogadores";
}

export async function GET() {
  try {
    const jogadores = await listarJogadoresDb();
    return NextResponse.json(jogadores);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/jogadores] Erro ao listar jogadores", {
      mensagem,
    });
    return NextResponse.json(
      { erro: "Erro ao listar jogadores", detalhe: mensagem },
      { status: 500 }
    );
  }
}
