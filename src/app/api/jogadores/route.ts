import { NextResponse } from "next/server";
import { listarJogadoresDb } from "@/lib/gols-db";

export async function GET() {
  try {
    const jogadores = await listarJogadoresDb();
    return NextResponse.json(jogadores);
  } catch {
    // Devolve lista vazia para a página carregar (ex.: Turso indisponível)
    return NextResponse.json([]);
  }
}
