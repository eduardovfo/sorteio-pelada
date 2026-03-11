import { NextResponse } from "next/server";
import { removerGol } from "@/lib/gols-file";

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
  } catch {
    return NextResponse.json(
      { erro: "Erro ao remover gol" },
      { status: 500 }
    );
  }
}
