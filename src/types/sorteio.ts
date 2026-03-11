export type Posicao = "ZAG" | "MEI" | "ATA";

export interface Jogador {
  nome: string;
  ZAG: number;
  MEI: number;
  ATA: number;
}

export interface Formacao {
  id: string;
  descricao: string;
  distribuicao: Record<Posicao, number>;
  prioridade: number;
}

export interface JogadorEscalado {
  jogador: Jogador;
  posicao: Posicao;
  notaNaPosicao: number;
}

export interface Time {
  id: number;
  nome: string;
  jogadores: JogadorEscalado[];
  formacaoUsada: Formacao;
  forcaTotal: number;
}

export interface ResultadoSorteio {
  times: Time[];
  diferencaForca: number;
  formacaoPrioritaria: Formacao;
  /** Jogadores que ficaram de fora (reservas / próxima rodada) */
  reservas: Jogador[];
}

