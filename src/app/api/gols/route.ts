import { NextResponse } from "next/server";
import type { GolsRecord } from "@/types/gols";
import {
  lerGolsDb,
  lerGolsPorPeladaDb,
  salvarGolsPorPeladaDb,
} from "@/lib/gols-db";
import { requireAdminOr401 } from "@/lib/require-admin-api";

function getMensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Erro interno ao processar gols";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("peladaId");
    if (raw != null && raw !== "") {
      const peladaId = Number(raw);
      if (!Number.isFinite(peladaId)) {
        return NextResponse.json(
          { erro: "peladaId inválido" },
          { status: 400 }
        );
      }
      const gols = await lerGolsPorPeladaDb(peladaId);
      return NextResponse.json(gols);
    }
    const gols = await lerGolsDb();
    return NextResponse.json(gols);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/gols] Erro no GET", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao carregar gols", detalhe: mensagem },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdminOr401();
    if (denied) return denied;

    const body = (await request.json()) as {
      peladaId?: unknown;
      gols?: unknown;
    };
    const peladaId = Number(body?.peladaId);
    if (!Number.isFinite(peladaId)) {
      return NextResponse.json(
        {
          erro: "peladaId é obrigatório (número). Envie { peladaId, gols }.",
        },
        { status: 400 }
      );
    }
    const raw = body.gols;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ erro: "gols inválido" }, { status: 400 });
    }
    const gols: GolsRecord = {};
    for (const [nome, valor] of Object.entries(raw as GolsRecord)) {
      const n = Number(valor);
      if (typeof nome === "string" && !Number.isNaN(n) && n >= 0) {
        gols[nome] = Math.floor(n);
      }
    }
    await salvarGolsPorPeladaDb(peladaId, gols);
    const atualizados = await lerGolsPorPeladaDb(peladaId);
    return NextResponse.json(atualizados);
  } catch (erro) {
    const mensagem = getMensagemErro(erro);
    console.error("[API /api/gols] Erro no POST", { mensagem });
    return NextResponse.json(
      { erro: "Erro ao salvar gols", detalhe: mensagem },
      { status: 500 }
    );
  }
}
