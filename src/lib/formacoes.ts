import type { Formacao, Posicao } from "@/types/sorteio";

export const POSICOES: Posicao[] = ["ZAG", "MEI", "ATA"];

export const FORMACOES_PRIORITARIAS: Formacao[] = [
  {
    id: "2-1-2",
    descricao: "2 ZAG / 1 MEI / 2 ATA",
    distribuicao: { ZAG: 2, MEI: 1, ATA: 2 },
    prioridade: 1
  },
  {
    id: "2-2-1",
    descricao: "2 ZAG / 2 MEI / 1 ATA",
    distribuicao: { ZAG: 2, MEI: 2, ATA: 1 },
    prioridade: 2
  },
  {
    id: "1-2-2",
    descricao: "1 ZAG / 2 MEI / 2 ATA",
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

