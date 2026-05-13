import { NextResponse } from "next/server";
import { adicionarGol } from "@/lib/gols-db";
import { requireAdminOr401 } from "@/lib/require-admin-api";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno ao adicionar gol";
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdminOr401();
    if (denied) return denied;

    const body = (await request.json()) as {
      nome?: string;
      peladaId?: unknown;
    };
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const peladaId = Number(body?.peladaId);
    if (!nome) {
      return NextResponse.json(
        { erro: "Nome do jogador é obrigatório" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(peladaId)) {
      return NextResponse.json(
        { erro: "peladaId é obrigatório" },
        { status: 400 }
      );
    }
    const gols = await adicionarGol(nome, peladaId);
    return NextResponse.json(gols);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/gols/adicionar] Erro no POST", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao adicionar gol", detalhe: mensagem },
      { status: 500 }
    );
  }
}
