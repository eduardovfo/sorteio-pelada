import type { Formacao, Posicao } from "@/types/sorteio";

export const POSICOES: Posicao[] = ["ZAG", "MEI", "ATA"];

/** Rótulo exibido ao usuário para cada posição interna. Padrão: DEF / MED / ATK. */
export const ROTULO_POSICAO: Record<Posicao, string> = {
  ZAG: "DEF",
  MEI: "MED",
  ATA: "ATK"
};

export function labelPosicao(p: Posicao): string {
  return ROTULO_POSICAO[p];
}

export const FORMACOES_PRIORITARIAS: Formacao[] = [
  {
    id: "2-1-2",
    descricao: "2 DEF / 1 MED / 2 ATK",
    distribuicao: { ZAG: 2, MEI: 1, ATA: 2 },
    prioridade: 1
  },
  {
    id: "2-2-1",
    descricao: "2 DEF / 2 MED / 1 ATK",
    distribuicao: { ZAG: 2, MEI: 2, ATA: 1 },
    prioridade: 2
  },
  {
    id: "1-2-2",
    descricao: "1 DEF / 2 MED / 2 ATK",
    distribuicao: { ZAG: 1, MEI: 2, ATA: 2 },
    prioridade: 3
  }
];

export function melhorFormacaoParaContagem(
  contagem: Record<Posicao, number>
): Formacao {
  let melhor: Formacao = FORMACOES_PRIORITARIAS[0];
  let melhorScore = Number.POSITIVE_INFINITY;

  for (const formacao of FORMACOES_PRIORITARIAS) {
    const distancia =
      Math.abs(contagem.ZAG - formacao.distribuicao.ZAG) +
      Math.abs(contagem.MEI - formacao.distribuicao.MEI) +
      Math.abs(contagem.ATA - formacao.distribuicao.ATA);

    const score = distancia * 10 + formacao.prioridade;

    if (score < melhorScore) {
      melhorScore = score;
      melhor = formacao;
    }
  }

  return melhor;
}
