import { NextResponse } from "next/server";
import type { PeladaAtualizarDestaquesInput } from "@/types/pelada";
import { atualizarDestaquesPeladaDb, obterPeladaDb } from "@/lib/gols-db";
import { requireAdminOr401 } from "@/lib/require-admin-api";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idRaw } = await context.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ erro: "id inválido" }, { status: 400 });
    }
    const pelada = await obterPeladaDb(id);
    if (!pelada) {
      return NextResponse.json({ erro: "Pelada não encontrada" }, { status: 404 });
    }
    return NextResponse.json(pelada);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/peladas/[id]] GET", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao buscar pelada", detalhe: mensagem },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminOr401();
    if (denied) return denied;

    const { id: idRaw } = await context.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ erro: "id inválido" }, { status: 400 });
    }
    const body = (await request.json()) as PeladaAtualizarDestaquesInput;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });
    }
    const atualizado = await atualizarDestaquesPeladaDb(id, body);
    if (!atualizado) {
      return NextResponse.json({ erro: "Pelada não encontrada" }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/peladas/[id]] PATCH", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao atualizar destaques", detalhe: mensagem },
      { status: 500 }
    );
  }
}
