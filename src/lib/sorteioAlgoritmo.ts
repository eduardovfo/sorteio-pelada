import type {
  Jogador,
  JogadorEscalado,
  Posicao,
  ResultadoSorteio,
  Time
} from "@/types/sorteio";
import {
  FORMACOES_PRIORITARIAS,
  POSICOES,
  labelPosicao,
  melhorFormacaoParaContagem
} from "@/lib/formacoes";
import { arredondaUmaCasa, umaCasaDecimal } from "@/lib/format-notas";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface TimeParcial {
  id: number;
  jogadores: JogadorEscalado[];
  contagemPosicao: Record<Posicao, number>;
  /** Quantos jogadores têm posição natural (melhor nota) em cada linha. */
  contagemNatural: Record<Posicao, number>;
  forcaTotal: number;
}

interface AvaliacaoDistribuicao {
  diferencaForca: number;
  penalidadeFormacao: number;
  penalidadeNatural: number;
  scoreTotal: number;
}

// ---------------------------------------------------------------------------
// Constantes e pesos
// ---------------------------------------------------------------------------

/** Nunca mais de 2 jogadores na mesma linha (formações 2-1-2, 2-2-1, 1-2-2). */
const MAX_POR_POSICAO = 2 as const;

const PESO = {
  forca: 1.0,
  formacao: 0.35,
  /**
   * Penalidade por concentração de posição natural: evita times com muitos
   * jogadores cujo melhor atributo é na mesma posição (ex.: 4 zageiros naturais).
   * Ideal = cada time ter no máximo 2 jogadores com a mesma posição natural.
   */
  posicaoNatural: 0.25,
  /**
   * Penalidade para times incompletos com força média acima da média global.
   * Evita reservar jogadores fortes para times que ainda receberão reforços,
   * tornando-os impossíveis de equilibrar quando novos jogadores chegarem.
   */
  timeIncompleto: 0.40,
  /** Parada antecipada: diferença de força / força do time mais forte ≤ este valor (5%). */
  earlyStopRelForca: 0.05,
  /**
   * Mínimo de tentativas com ordem aleatória antes de permitir parada antecipada.
   * Sem isso, a 1.ª construção “boa” encerra o loop e o algoritmo tende a repetir os mesmos times.
   */
  minTentativasAntesEarlyStop: 40,
  /**
   * Penaliza duplas que já estiveram no mesmo time no sorteio imediatamente anterior,
   * para o “sortear de novo” mudar composição (ex.: não manter sempre os mesmos pares).
   * Peso elevado: mantém a anti-repetição competitiva com o peso de força e
   * evita que o algoritmo prefira repetir os mesmos pares para ganhar 0.1 de
   * equilíbrio.
   */
  repetirColegaRodadaAnterior: 0.7
} as const;

/**
 * Margem em scoreTotal para considerar soluções “equivalentes” e sortear uma
 * delas ao final. Margem larga = mais variedade entre sorteios consecutivos
 * (sem sacrificar equilíbrio de forma perceptível).
 */
function margemScoreEquivalente(melhorScore: number): number {
  return Math.max(0.025, melhorScore * 0.22);
}

/** Chave canónica para o par (independente da ordem dos nomes). */
function chaveParColegas(nomeA: string, nomeB: string): string {
  return nomeA.localeCompare(nomeB, "pt-BR") <= 0 ? `${nomeA}\0${nomeB}` : `${nomeB}\0${nomeA}`;
}

/**
 * Pares de jogadores que estiveram juntos no resultado anterior, restrito a quem
 * está no sorteio atual (evita penalizar com nomes que saíram da seleção).
 */
function paresColegasDoResultadoAnterior(
  resultado: ResultadoSorteio | null | undefined,
  nomesNoSorteio: ReadonlySet<string>
): ReadonlySet<string> {
  const pares = new Set<string>();
  if (!resultado?.times?.length) return pares;

  for (const time of resultado.times) {
    const nomes = time.jogadores
      .map((e) => e.jogador.nome)
      .filter((n) => nomesNoSorteio.has(n));
    for (let i = 0; i < nomes.length; i++) {
      for (let j = i + 1; j < nomes.length; j++) {
        pares.add(chaveParColegas(nomes[i], nomes[j]));
      }
    }
  }
  return pares;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function criarTimeParcial(id: number): TimeParcial {
  return {
    id,
    jogadores: [],
    contagemPosicao: { ZAG: 0, MEI: 0, ATA: 0 },
    contagemNatural: { ZAG: 0, MEI: 0, ATA: 0 },
    forcaTotal: 0
  };
}

function clonarTimeParcial(t: TimeParcial): TimeParcial {
  return {
    id: t.id,
    jogadores: [...t.jogadores],
    contagemPosicao: { ...t.contagemPosicao },
    contagemNatural: { ...t.contagemNatural },
    forcaTotal: t.forcaTotal
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

function melhorNotaDoJogador(j: Jogador): number {
  return Math.max(j.ZAG, j.MEI, j.ATA);
}

/** Retorna a posição onde o jogador tem a maior nota (desempate: ZAG > MEI > ATA). */
function posicaoNaturalDo(j: Jogador): Posicao {
  const notaMax = melhorNotaDoJogador(j);
  // Prioridade de desempate: mantém consistência com escolherPosicaoParaJogador
  for (const p of POSICOES) {
    if (Math.abs(j[p] - notaMax) < 1e-6) return p;
  }
  return "MEI";
}

function contagensRespeitamTeto(t: TimeParcial): boolean {
  return POSICOES.every((p) => t.contagemPosicao[p] <= MAX_POR_POSICAO);
}

// ---------------------------------------------------------------------------
// Função de custo (normalizada)
// ---------------------------------------------------------------------------

function avaliarDistribuicao(
  times: TimeParcial[],
  paresColegasRodadaAnterior?: ReadonlySet<string> | null
): AvaliacaoDistribuicao {
  if (times.length === 0) {
    return { diferencaForca: 0, penalidadeFormacao: 0, penalidadeNatural: 0, scoreTotal: 0 };
  }

  const forcas = times.map((t) => t.forcaTotal);
  const max = Math.max(...forcas);
  const min = Math.min(...forcas);
  const diferencaForca = arredondaUmaCasa(max - min);

  const somaForcas = forcas.reduce((a, b) => a + b, 0);
  const forcaMediaPorTime = times.length > 0 ? somaForcas / times.length : 0;
  const diferencaNorm =
    forcaMediaPorTime > 1e-6 ? diferencaForca / forcaMediaPorTime : 0;

  let penalidadeFormacao = 0;
  for (const time of times) {
    const melhor = melhorFormacaoParaContagem(time.contagemPosicao);
    for (const p of POSICOES) {
      const desvio = time.contagemPosicao[p] - melhor.distribuicao[p];
      penalidadeFormacao += Math.abs(desvio);
      if (time.contagemPosicao[p] > MAX_POR_POSICAO) {
        penalidadeFormacao += (time.contagemPosicao[p] - MAX_POR_POSICAO) * 3;
      }
    }
  }

  const maxDesviosPossivel = times.length * POSICOES.length * 2;
  const formacaoNorm =
    maxDesviosPossivel > 0 ? penalidadeFormacao / maxDesviosPossivel : 0;

  /**
   * Penalidade de concentração de posição natural:
   * Para cada time, conta quantos jogadores têm sua melhor nota em cada posição.
   * Se mais de 2 jogadores têm a mesma posição natural, penaliza o excesso.
   * Normalizado pelo total máximo de excesso possível.
   */
  let penalidadeNatural = 0;
  for (const time of times) {
    // Usa contagemNatural já mantida no TimeParcial (evita recomputar a cada avaliação)
    for (const p of POSICOES) {
      if (time.contagemNatural[p] > MAX_POR_POSICAO) {
        penalidadeNatural += time.contagemNatural[p] - MAX_POR_POSICAO;
      }
    }
  }
  const maxNaturalPossivel = times.length * (5 - MAX_POR_POSICAO); // excesso máximo teórico
  const naturalNorm = maxNaturalPossivel > 0 ? penalidadeNatural / maxNaturalPossivel : 0;

  /**
   * Penalidade para times incompletos com força média por jogador acima da média.
   *
   * Raciocínio: um time incompleto com média alta vai receber jogadores novos
   * no futuro. Se já está "rico", ficará ainda mais forte — impossível de
   * equilibrar. O ideal é que o time incompleto tenha força média ≤ média global.
   *
   * Só se aplica se houver pelo menos um time com menos de 5 jogadores.
   */
  let penalidadeIncompleto = 0;
  const timesIncompletos = times.filter((t) => t.jogadores.length < 5);
  if (timesIncompletos.length > 0) {
    const mediaGlobal =
      somaForcas / times.reduce((acc, t) => acc + t.jogadores.length, 0);
    for (const t of timesIncompletos) {
      if (t.jogadores.length === 0) continue;
      const mediaDoParcial = t.forcaTotal / t.jogadores.length;
      const excesso = mediaDoParcial - mediaGlobal;
      if (excesso > 0) {
        // Normaliza pelo valor máximo esperado de excesso (nota máxima possível = 5)
        penalidadeIncompleto += excesso / 5;
      }
    }
  }

  let penalidadeRepetirColega = 0;
  if (paresColegasRodadaAnterior && paresColegasRodadaAnterior.size > 0) {
    for (const time of times) {
      const nomes = time.jogadores.map((e) => e.jogador.nome);
      for (let i = 0; i < nomes.length; i++) {
        for (let j = i + 1; j < nomes.length; j++) {
          if (paresColegasRodadaAnterior.has(chaveParColegas(nomes[i], nomes[j]))) {
            penalidadeRepetirColega += 1;
          }
        }
      }
    }
  }
  const repNorm =
    paresColegasRodadaAnterior && paresColegasRodadaAnterior.size > 0
      ? penalidadeRepetirColega / paresColegasRodadaAnterior.size
      : 0;

  const scoreTotal =
    PESO.forca * diferencaNorm +
    PESO.formacao * formacaoNorm +
    PESO.posicaoNatural * naturalNorm +
    PESO.timeIncompleto * penalidadeIncompleto +
    PESO.repetirColegaRodadaAnterior * repNorm;

  return { diferencaForca, penalidadeFormacao, penalidadeNatural, scoreTotal };
}

// ---------------------------------------------------------------------------
// Escolha de posição para um jogador em um time
// ---------------------------------------------------------------------------

function escolherPosicaoParaJogador(
  jogador: Jogador,
  time: TimeParcial
): JogadorEscalado | null {
  const notaMaxima = melhorNotaDoJogador(jogador);
  const EPS = 1e-6;

  /**
   * Hierarquia de candidatos (do mais restritivo ao mais permissivo):
   *
   * Nível 1 — posições onde a nota é máxima E cabem no teto  ← caminho feliz
   * Nível 2 — posições onde a nota é máxima (ignora teto)    ← linha cheia mas mantém nota
   * Nível 3 — qualquer posição com nota > 0 dentro do teto   ← formação força posição secundária
   * Nível 4 — qualquer posição com nota > 0                  ← fallback absoluto
   *
   * Jogadores SÓ saem do nível 1 quando a formação não deixa outra escolha.
   * Isso evita "Felipe ATA 5.0 → ZAG 2.0 porque a zaga precisa de alguém".
   */
  const comNota = POSICOES.filter((p) => jogador[p] > 0);
  const nasMelhores = comNota.filter((p) => jogador[p] >= notaMaxima - EPS);
  const posNatural = posicaoNaturalDo(jogador);

  /**
   * Hierarquia de candidatos — 5 níveis:
   *
   * Nível 1 — nota máxima + teto de posição escalada + teto de posição natural ← ideal
   * Nível 2 — nota máxima + teto de posição escalada (ignora concentração natural)
   * Nível 3 — nota máxima (ignora ambos os tetos — linha cheia mas mantém nota)
   * Nível 4 — qualquer nota > 0 dentro do teto de posição escalada
   * Nível 5 — qualquer nota > 0 (fallback absoluto)
   *
   * O teto de posição natural (MAX_POR_POSICAO = 2) evita times com 3+ jogadores
   * cujo melhor atributo é na mesma linha (ex.: 4 zageiros naturais no mesmo time).
   */
  const nivel1 = nasMelhores.filter(
    (p) =>
      time.contagemPosicao[p] < MAX_POR_POSICAO &&
      time.contagemNatural[posNatural] < MAX_POR_POSICAO
  );
  const nivel2 = nasMelhores.filter((p) => time.contagemPosicao[p] < MAX_POR_POSICAO);
  const nivel3 = nasMelhores;
  const nivel4 = comNota.filter((p) => time.contagemPosicao[p] < MAX_POR_POSICAO);
  const nivel5 = comNota;

  const candidatos =
    nivel1.length > 0 ? nivel1 :
    nivel2.length > 0 ? nivel2 :
    nivel3.length > 0 ? nivel3 :
    nivel4.length > 0 ? nivel4 :
    nivel5.length > 0 ? nivel5 :
    POSICOES;

  /**
   * Score dentro dos candidatos já filtrados:
   *
   * - notaNorm (peso 1.0): nota do jogador / sua nota máxima → sempre em [0,1].
   *   É dominante: uma diferença de nota real nunca é revertida pela formação.
   * - aproximacao (peso 0.08): aproximação à formação alvo do time atual.
   *   Apenas desempate — nunca inverte ordem de notas com diferença real.
   * - lotacao (peso 0.04): penalidade por linha já com muitos jogadores.
   */
  const formacaoAlvo = melhorFormacaoParaContagem(time.contagemPosicao).distribuicao;

  let melhor: JogadorEscalado | null = null;
  let melhorScore = -Infinity;

  for (const posicao of candidatos) {
    const nota = jogador[posicao];
    if (nota <= 0) continue;

    const notaNorm = nota / notaMaxima;

    const antes = Math.abs(time.contagemPosicao[posicao] - formacaoAlvo[posicao]);
    const depois = Math.abs(time.contagemPosicao[posicao] + 1 - formacaoAlvo[posicao]);
    const aproximacao = antes - depois; // +1 = aproxima, -1 = afasta, 0 = neutro

    // Penaliza leve se colocar nesta posição concentraria ainda mais a posição natural do jogador
    const excessoNatural = Math.max(0, time.contagemNatural[posNatural] + 1 - MAX_POR_POSICAO);

    const score =
      notaNorm * 1.0 +
      aproximacao * 0.08 -
      (time.contagemPosicao[posicao] / MAX_POR_POSICAO) * 0.04 -
      excessoNatural * 0.15;

    if (score > melhorScore + 1e-9) {
      melhorScore = score;
      melhor = { jogador, posicao, notaNaPosicao: nota };
    } else if (Math.abs(score - melhorScore) <= 1e-9 && Math.random() < 0.5) {
      melhor = { jogador, posicao, notaNaPosicao: nota };
    }
  }

  return melhor;
}

// ---------------------------------------------------------------------------
// Limites de jogadores por time
// ---------------------------------------------------------------------------

function limiteJogadoresNoTime(
  indice: number,
  total: number,
  quantidadeTimes: number
): number {
  const resto = total % 5;
  if (resto === 0) return 5;
  if (indice < quantidadeTimes - 1) return 5;
  return resto;
}

// ---------------------------------------------------------------------------
// Busca local: tenta trocas de jogadores entre pares de times
// ---------------------------------------------------------------------------

/**
 * 2-opt entre times: para cada par, tenta trocar um jogador de cada um.
 *
 * Diferencial em relação à versão anterior: ao simular a troca, a posição de
 * cada jogador é REATRIBUÍDA pelo escolherPosicaoParaJogador no novo contexto.
 * Isso corrige casos em que um jogador foi mal escalado na construção inicial
 * (ex.: Felipe forçado como ZAG) — a troca o coloca no time novo já como ATA.
 */
function buscaLocal(
  times: TimeParcial[],
  mediaNotaMaximaGlobal: number,
  maxPassagens = 4,
  paresColegasRodadaAnterior?: ReadonlySet<string> | null
): TimeParcial[] {
  let resultado = times.map(clonarTimeParcial);
  let melhorScore = avaliarDistribuicao(resultado, paresColegasRodadaAnterior).scoreTotal;
  let melhorou = true;
  let passagens = 0;

  const total = times.reduce((acc, t) => acc + t.jogadores.length, 0);
  const quantidadeTimes = times.length;
  // Índice do time incompleto (sempre o último, se existir)
  const indiceIncompleto = times.findIndex(
    (t) => limiteJogadoresNoTime(times.indexOf(t), total, quantidadeTimes) < 5
  );

  /**
   * Bloqueia qualquer troca que envolva o time incompleto.
   * Os jogadores do time incompleto foram escolhidos intencionalmente (os mais
   * fracos) para deixar espaço para reforços futuros — não devem ser mexidos.
   */
  function trocaEnvolveTimeIncompleto(indiceA: number, indiceB: number): boolean {
    return indiceA === indiceIncompleto || indiceB === indiceIncompleto;
  }

  while (melhorou && passagens < maxPassagens) {
    melhorou = false;
    passagens++;

    for (let a = 0; a < resultado.length - 1; a++) {
      for (let b = a + 1; b < resultado.length; b++) {
        const timeA = resultado[a];
        const timeB = resultado[b];

        for (let ia = 0; ia < timeA.jogadores.length; ia++) {
          for (let ib = 0; ib < timeB.jogadores.length; ib++) {
            const jaA = timeA.jogadores[ia]; // sai do time A
            const jaB = timeB.jogadores[ib]; // sai do time B

            // Só troca se os times têm o mesmo limite (evita romper restrição de tamanho)
            const limA = limiteJogadoresNoTime(a, resultado.length * 5, resultado.length);
            const limB = limiteJogadoresNoTime(b, resultado.length * 5, resultado.length);
            if (limA !== limB) continue;

            // Bloqueio duro: o time incompleto não participa de trocas
            if (trocaEnvolveTimeIncompleto(a, b)) continue;

            // Remove os dois jogadores dos seus times originais
            const timeASem: TimeParcial = {
              ...timeA,
              jogadores: timeA.jogadores.filter((_, i) => i !== ia),
              contagemPosicao: { ...timeA.contagemPosicao },
              contagemNatural: { ...timeA.contagemNatural },
              forcaTotal: timeA.forcaTotal - jaA.notaNaPosicao
            };
            timeASem.contagemPosicao[jaA.posicao] -= 1;
            timeASem.contagemNatural[posicaoNaturalDo(jaA.jogador)] -= 1;

            const timeBSem: TimeParcial = {
              ...timeB,
              jogadores: timeB.jogadores.filter((_, i) => i !== ib),
              contagemPosicao: { ...timeB.contagemPosicao },
              contagemNatural: { ...timeB.contagemNatural },
              forcaTotal: timeB.forcaTotal - jaB.notaNaPosicao
            };
            timeBSem.contagemPosicao[jaB.posicao] -= 1;
            timeBSem.contagemNatural[posicaoNaturalDo(jaB.jogador)] -= 1;

            // Reatribui posição ideal no novo contexto (não herda a posição original)
            const jaBnoA = escolherPosicaoParaJogador(jaB.jogador, timeASem);
            const jAnoB = escolherPosicaoParaJogador(jaA.jogador, timeBSem);
            if (!jaBnoA || !jAnoB) continue;

            const novosA: TimeParcial = {
              ...timeASem,
              jogadores: [...timeASem.jogadores, jaBnoA],
              contagemPosicao: { ...timeASem.contagemPosicao },
              contagemNatural: { ...timeASem.contagemNatural },
              forcaTotal: timeASem.forcaTotal + jaBnoA.notaNaPosicao
            };
            novosA.contagemPosicao[jaBnoA.posicao] += 1;
            novosA.contagemNatural[posicaoNaturalDo(jaBnoA.jogador)] += 1;

            const novosB: TimeParcial = {
              ...timeBSem,
              jogadores: [...timeBSem.jogadores, jAnoB],
              contagemPosicao: { ...timeBSem.contagemPosicao },
              contagemNatural: { ...timeBSem.contagemNatural },
              forcaTotal: timeBSem.forcaTotal + jAnoB.notaNaPosicao
            };
            novosB.contagemPosicao[jAnoB.posicao] += 1;
            novosB.contagemNatural[posicaoNaturalDo(jAnoB.jogador)] += 1;

            if (
              !POSICOES.every((p) => novosA.contagemPosicao[p] >= 0) ||
              !POSICOES.every((p) => novosB.contagemPosicao[p] >= 0) ||
              !contagensRespeitamTeto(novosA) ||
              !contagensRespeitamTeto(novosB)
            ) {
              continue;
            }

            const timesNovos = resultado.map((t, i) => {
              if (i === a) return novosA;
              if (i === b) return novosB;
              return t;
            });

            const novoScore = avaliarDistribuicao(
              timesNovos,
              paresColegasRodadaAnterior
            ).scoreTotal;

            if (novoScore < melhorScore - 1e-9) {
              resultado = timesNovos;
              melhorScore = novoScore;
              melhorou = true;
            }
          }
        }
      }
    }
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Montagem de uma distribuição (uma tentativa)
// ---------------------------------------------------------------------------

function montarDistribuicao(
  jogadores: Jogador[],
  total: number,
  quantidadeTimes: number,
  mediaNotaMaxima: number,
  paresColegasRodadaAnterior?: ReadonlySet<string> | null
): TimeParcial[] {
  const resto = total % 5;
  const indiceTimeIncompleto = resto > 0 ? quantidadeTimes - 1 : -1;

  /**
   * O time incompleto vai receber jogadores desconhecidos (perdedores do 1º jogo).
   * Para não criar desequilíbrio, ele deve ficar com jogadores entre os mais
   * FRACOS do sorteio atual. Assim, qualquer reforço que chegue terá espaço
   * para equilibrar.
   *
   * Estratégia: montar um POOL com os mais fracos (tamanho ~2× `resto`,
   * mínimo `resto + 2`) e sortear `resto` jogadores dentro desse pool. Isso
   * garante que o time incompleto fica fraco *na média* sem prender os mesmos
   * 2 jogadores em todo sorteio — evita o cenário "Paulinho e Wallace ficam
   * juntos no Time 3 toda vez".
   *
   * Empates por nota máxima são embaralhados antes do slice para que jogadores
   * de mesma força tenham chance equilibrada de entrar no pool.
   */
  let jogadoresDoIncompleto: Jogador[] = [];
  let jogadoresDosTimes: Jogador[] = jogadores;

  if (indiceTimeIncompleto >= 0) {
    // Embaralha primeiro para desempatar nota máxima de forma aleatória,
    // depois ordena por nota crescente (sort é estável, então empates ficam
    // na ordem aleatória definida pelo embaralhar).
    const ordenados = embaralhar(jogadores).sort(
      (a, b) => melhorNotaDoJogador(a) - melhorNotaDoJogador(b)
    );
    const tamanhoPoolFracos = Math.min(
      jogadores.length,
      Math.max(resto + 2, resto * 2)
    );
    const poolFracos = ordenados.slice(0, tamanhoPoolFracos);
    jogadoresDoIncompleto = embaralhar(poolFracos).slice(0, resto);
    const idsIncompleto = new Set(jogadoresDoIncompleto.map((j) => j.nome));
    jogadoresDosTimes = jogadores.filter((j) => !idsIncompleto.has(j.nome));
  }

  const times: TimeParcial[] = Array.from({ length: quantidadeTimes }, (_, i) =>
    criarTimeParcial(i + 1)
  );

  // Pré-aloca os jogadores mais fracos no time incompleto
  for (const jogador of embaralhar(jogadoresDoIncompleto)) {
    const escalado = escolherPosicaoParaJogador(jogador, times[indiceTimeIncompleto]);
    if (!escalado) continue;
    times[indiceTimeIncompleto].jogadores.push(escalado);
    times[indiceTimeIncompleto].contagemPosicao[escalado.posicao] += 1;
    times[indiceTimeIncompleto].contagemNatural[posicaoNaturalDo(escalado.jogador)] += 1;
    times[indiceTimeIncompleto].forcaTotal += escalado.notaNaPosicao;
  }

  // Distribui os demais apenas entre os times completos
  const jogadoresEmbaralhados = embaralhar(jogadoresDosTimes);
  const indicesCompletos = times
    .map((_, i) => i)
    .filter((i) => i !== indiceTimeIncompleto);

  function timePodeReceberJogador(indice: number): boolean {
    if (indice === indiceTimeIncompleto) return false; // já foi preenchido acima
    const time = times[indice];
    const limite = 5;
    return time.jogadores.length < limite;
  }

  for (const jogador of jogadoresEmbaralhados) {
    let melhorTimeIndex = indicesCompletos[0] ?? 0;
    let melhorScoreGlobal = Infinity;
    let melhorEscalacao: JogadorEscalado | null = null;

    for (let i = 0; i < times.length; i++) {
      if (!timePodeReceberJogador(i)) continue;

      const escalado = escolherPosicaoParaJogador(jogador, times[i]);
      if (!escalado) continue;

      const timesSimulados = times.map((t, idx) => {
        if (idx !== i) return t;
        const copia = clonarTimeParcial(t);
        copia.jogadores.push(escalado);
        copia.contagemPosicao[escalado.posicao] += 1;
        copia.contagemNatural[posicaoNaturalDo(escalado.jogador)] += 1;
        copia.forcaTotal += escalado.notaNaPosicao;
        return copia;
      });

      const { scoreTotal } = avaliarDistribuicao(
        timesSimulados,
        paresColegasRodadaAnterior
      );

      if (scoreTotal < melhorScoreGlobal - 1e-9) {
        melhorScoreGlobal = scoreTotal;
        melhorTimeIndex = i;
        melhorEscalacao = escalado;
      } else if (Math.abs(scoreTotal - melhorScoreGlobal) <= 1e-9) {
        if (Math.random() < 0.5) {
          melhorTimeIndex = i;
          melhorEscalacao = escalado;
        }
      }
    }

    if (melhorTimeIndex === -1) melhorTimeIndex = 0;

    const alvo = times[melhorTimeIndex];
    const escalacaoFinal: JogadorEscalado = melhorEscalacao ?? {
      jogador,
      posicao: "MEI",
      notaNaPosicao: jogador.MEI
    };

    alvo.jogadores.push(escalacaoFinal);
    alvo.contagemPosicao[escalacaoFinal.posicao] += 1;
    alvo.contagemNatural[posicaoNaturalDo(escalacaoFinal.jogador)] += 1;
    alvo.forcaTotal += escalacaoFinal.notaNaPosicao;
  }

  return times;
}

// ---------------------------------------------------------------------------
// Orquestrador principal
// ---------------------------------------------------------------------------

function distribuirJogadoresEmTimes(
  jogadores: Jogador[],
  paresColegasRodadaAnterior?: ReadonlySet<string> | null
): {
  timesFinais: Time[];
  avaliacao: AvaliacaoDistribuicao;
} | null {
  const total = jogadores.length;
  if (total < 5) return null;

  const quantidadeTimes = Math.ceil(total / 5);
  const tentativas = Math.min(300, 80 + total * 6);

  // Referência global de "jogador forte" — usada na construção e na busca local
  const mediaNotaMaximaGlobal =
    jogadores.reduce((acc, j) => acc + melhorNotaDoJogador(j), 0) / jogadores.length;

  let melhorScore = Infinity;
  const poolCandidatos: { avaliacao: AvaliacaoDistribuicao; times: TimeParcial[] }[] = [];

  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    let times = montarDistribuicao(
      jogadores,
      total,
      quantidadeTimes,
      mediaNotaMaximaGlobal,
      paresColegasRodadaAnterior
    );
    times = buscaLocal(times, mediaNotaMaximaGlobal, 4, paresColegasRodadaAnterior);

    const avaliacao = avaliarDistribuicao(times, paresColegasRodadaAnterior);

    if (avaliacao.scoreTotal < melhorScore - 1e-9) {
      melhorScore = avaliacao.scoreTotal;
      poolCandidatos.length = 0;
      poolCandidatos.push({
        avaliacao,
        times: times.map(clonarTimeParcial)
      });
    } else if (avaliacao.scoreTotal <= melhorScore + margemScoreEquivalente(melhorScore)) {
      poolCandidatos.push({
        avaliacao,
        times: times.map(clonarTimeParcial)
      });
      if (poolCandidatos.length > 80) {
        while (poolCandidatos.length > 80) {
          poolCandidatos.pop();
        }
      }
    }

    const melhorParcial = poolCandidatos[0];
    if (!melhorParcial) continue;

    const forcasMelhor = melhorParcial.times.map((t) => t.forcaTotal);
    const maxForca = Math.max(...forcasMelhor);
    const relDiff =
      maxForca > 1e-6 ? melhorParcial.avaliacao.diferencaForca / maxForca : 0;
    const podePararAntecipado =
      tentativa + 1 >= PESO.minTentativasAntesEarlyStop &&
      melhorParcial.avaliacao.penalidadeFormacao === 0 &&
      melhorParcial.avaliacao.penalidadeNatural === 0 &&
      relDiff <= PESO.earlyStopRelForca;

    if (podePararAntecipado) {
      break;
    }
  }

  if (poolCandidatos.length === 0) return null;

  const melhorResultado =
    poolCandidatos[Math.floor(Math.random() * poolCandidatos.length)]!;
  const avaliacaoFinal = avaliarDistribuicao(
    melhorResultado.times,
    paresColegasRodadaAnterior
  );

  const timesFinais: Time[] = melhorResultado.times.map((t) => {
    const formacao = melhorFormacaoParaContagem(t.contagemPosicao);
    return {
      id: t.id,
      nome: `Time ${t.id}`,
      jogadores: t.jogadores,
      formacaoUsada: formacao,
      forcaTotal: arredondaUmaCasa(t.forcaTotal)
    };
  });

  return { timesFinais, avaliacao: avaliacaoFinal };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function sortearTimesEquilibrados(
  jogadoresSelecionados: Jogador[],
  /** Se informado, duplas que jogaram juntas aqui recebem penalidade no novo sorteio. */
  resultadoAnterior?: ResultadoSorteio | null
): ResultadoSorteio | null {
  const total = jogadoresSelecionados.length;
  if (total < 10) return null;

  const nomesSorteio = new Set(jogadoresSelecionados.map((j) => j.nome));
  const paresColegasAnterior = paresColegasDoResultadoAnterior(
    resultadoAnterior,
    nomesSorteio
  );

  const resultado = distribuirJogadoresEmTimes(
    jogadoresSelecionados,
    paresColegasAnterior.size > 0 ? paresColegasAnterior : null
  );
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
    const sufixo = time.jogadores.length < 5 ? " (incompleto)" : "";
    linhas.push(`${time.nome}${sufixo} (${time.formacaoUsada.descricao})`);
    linhas.push(`Força total: ${umaCasaDecimal(time.forcaTotal)}`);
    linhas.push("");
    for (const escalado of time.jogadores) {
      linhas.push(
        `${escalado.jogador.nome} - ${labelPosicao(escalado.posicao)} (${umaCasaDecimal(escalado.notaNaPosicao)})`
      );
    }
    linhas.push("");
  }

  linhas.push(
    `Diferença de força entre o mais forte e o mais fraco: ${umaCasaDecimal(resultado.diferencaForca)}`
  );

  return linhas.join("\n");
}
