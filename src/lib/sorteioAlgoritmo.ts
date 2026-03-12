import type {
  Jogador,
  JogadorEscalado,
  Posicao,
  ResultadoSorteio,
  Time
} from "@/types/sorteio";
import { FORMACOES_PRIORITARIAS, POSICOES, melhorFormacaoParaContagem } from "@/lib/formacoes";

interface TimeParcial {
  id: number;
  jogadores: JogadorEscalado[];
  contagemPosicao: Record<Posicao, number>;
  forcaTotal: number;
}

interface AvaliacaoDistribuicao {
  diferencaForca: number;
  penalidadeFormacao: number;
  scoreTotal: number;
}

function criarTimeParcial(id: number): TimeParcial {
  return {
    id,
    jogadores: [],
    contagemPosicao: { ZAG: 0, MEI: 0, ATA: 0 },
    forcaTotal: 0
  };
}

function embaralhar<T>(lista: T[]): T[] {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Retorna uma cópia da lista com n elementos aleatórios (Fisher-Yates parcial). */
function amostraAleatoria<T>(lista: T[], n: number): T[] {
  if (n >= lista.length) return [...lista];
  const arr = [...lista];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

function avaliarDistribuicao(times: TimeParcial[]): AvaliacaoDistribuicao {
  if (times.length === 0) {
    return { diferencaForca: 0, penalidadeFormacao: 0, scoreTotal: 0 };
  }

  const forcas = times.map((t) => t.forcaTotal);
  const max = Math.max(...forcas);
  const min = Math.min(...forcas);
  const diferencaForca = max - min;

  let penalidadeFormacao = 0;
  for (const time of times) {
    const melhorFormacao = melhorFormacaoParaContagem(time.contagemPosicao);
    const dist =
      Math.abs(time.contagemPosicao.ZAG - melhorFormacao.distribuicao.ZAG) +
      Math.abs(time.contagemPosicao.MEI - melhorFormacao.distribuicao.MEI) +
      Math.abs(time.contagemPosicao.ATA - melhorFormacao.distribuicao.ATA);
    penalidadeFormacao += dist;
  }

  const scoreTotal = diferencaForca * 10 + penalidadeFormacao * 6;

  return { diferencaForca, penalidadeFormacao, scoreTotal };
}

function escolherPosicaoParaJogador(
  jogador: Jogador,
  time: TimeParcial
): JogadorEscalado | null {
  let melhor: JogadorEscalado | null = null;
  let melhorScore = -Infinity;

  for (const posicao of POSICOES) {
    const nota = jogador[posicao];
    if (nota <= 0) continue;

    const contagemAtual = time.contagemPosicao[posicao];
    const formacaoAlvo = FORMACOES_PRIORITARIAS[0].distribuicao;
    const distanciaAntes = Math.abs(contagemAtual - formacaoAlvo[posicao]);
    const distanciaDepois = Math.abs(contagemAtual + 1 - formacaoAlvo[posicao]);

    const aproximacaoFormacao = distanciaAntes - distanciaDepois;
    const score =
      nota * 4 + aproximacaoFormacao * 3 - contagemAtual * 0.5;

    if (score > melhorScore) {
      melhorScore = score;
      melhor = {
        jogador,
        posicao,
        notaNaPosicao: nota
      };
    }
  }

  return melhor;
}

function distribuirJogadoresEmTimes(
  jogadores: Jogador[]
): { timesFinais: Time[]; avaliacao: AvaliacaoDistribuicao } | null {
  const total = jogadores.length;
  if (total < 5) return null;

  const quantidadeTimes = Math.ceil(total / 5);
  const tentativas = 220;

  let melhorResultado: {
    avaliacao: AvaliacaoDistribuicao;
    times: TimeParcial[];
  } | null = null;

  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    const jogadoresEmbaralhados = embaralhar(jogadores);
    const times: TimeParcial[] = [];
    for (let i = 0; i < quantidadeTimes; i++) {
      times.push(criarTimeParcial(i + 1));
    }

    for (const jogador of jogadoresEmbaralhados) {
      let melhorTimeIndex = 0;
      let melhorScoreGlobal = Infinity;
      let melhorEscalacao: JogadorEscalado | null = null;

      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        if (time.jogadores.length >= 5) continue;

        const escalado = escolherPosicaoParaJogador(jogador, time);
        if (!escalado) continue;

        const timesSimulados = times.map((t, idx) => {
          if (idx !== i) return t;
          const copia: TimeParcial = {
            id: t.id,
            jogadores: [...t.jogadores, escalado],
            contagemPosicao: { ...t.contagemPosicao },
            forcaTotal: t.forcaTotal + escalado.notaNaPosicao
          };
          copia.contagemPosicao[escalado.posicao] += 1;
          return copia;
        });

        const avaliacao = avaliarDistribuicao(timesSimulados);

        if (avaliacao.scoreTotal < melhorScoreGlobal) {
          melhorScoreGlobal = avaliacao.scoreTotal;
          melhorTimeIndex = i;
          melhorEscalacao = escalado;
        }
      }

      const alvo = times[melhorTimeIndex];
      const escalacaoFinal =
        melhorEscalacao ??
        ({
          jogador,
          posicao: "MEI",
          notaNaPosicao: jogador.MEI
        } as JogadorEscalado);

      alvo.jogadores.push(escalacaoFinal);
      alvo.contagemPosicao[escalacaoFinal.posicao] += 1;
      alvo.forcaTotal += escalacaoFinal.notaNaPosicao;
    }

    const avaliacaoFinal = avaliarDistribuicao(times);
    if (
      !melhorResultado ||
      avaliacaoFinal.scoreTotal < melhorResultado.avaliacao.scoreTotal
    ) {
      melhorResultado = { avaliacao: avaliacaoFinal, times };
    }
  }

  if (!melhorResultado) return null;

  const timesFinais: Time[] = melhorResultado.times.map((t) => {
    const formacao = melhorFormacaoParaContagem(t.contagemPosicao);
    return {
      id: t.id,
      nome: `Time ${t.id}`,
      jogadores: t.jogadores,
      formacaoUsada: formacao,
      forcaTotal: t.forcaTotal
    };
  });

  return {
    timesFinais,
    avaliacao: melhorResultado.avaliacao
  };
}

export function sortearTimesEquilibrados(
  jogadoresSelecionados: Jogador[]
): ResultadoSorteio | null {
  const total = jogadoresSelecionados.length;
  if (total < 10) return null;
  const resultado = distribuirJogadoresEmTimes(jogadoresSelecionados);
  if (!resultado) return null;
  return {
    times: resultado.timesFinais,
    diferencaForca: resultado.avaliacao.diferencaForca,
    formacaoPrioritaria: FORMACOES_PRIORITARIAS[0],
    reservas: []
  };
}

export function gerarTextoCompartilhamento(resultado: ResultadoSorteio): string {
  const linhas: string[] = [];

  for (const time of resultado.times) {
    linhas.push(`${time.nome} (${time.formacaoUsada.descricao})`);
    linhas.push(`Força total: ${time.forcaTotal}`);
    linhas.push("");
    for (const escalado of time.jogadores) {
      linhas.push(
        `${escalado.jogador.nome} - ${escalado.posicao} (${escalado.notaNaPosicao})`
      );
    }
    linhas.push("");
  }

  linhas.push(
    `Diferença de força entre o mais forte e o mais fraco: ${resultado.diferencaForca}`
  );

  return linhas.join("\n");
}
