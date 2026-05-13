/** Destaques da pelada (nomes dos jogadores). Campos opcionais. */
export type DestaquesPelada = {
  craque?: string | null;
  pereba?: string | null;
  artilheiro?: string | null;
  garcom?: string | null;
  xerifao?: string | null;
  paredao?: string | null;
  bolaMurcha?: string | null;
};

/** Pelada = dia da quadrinha (quartas). */
export type Pelada = {
  id: number;
  dataPelada: string;
  destaques: DestaquesPelada;
};

export type PeladaCriarInput = {
  dataPelada: string;
  destaques?: Partial<DestaquesPelada>;
};

export type PeladaAtualizarDestaquesInput = Partial<DestaquesPelada>;

/** Uma pelada com artilharia daquela noite (para exibição pública). */
export type PeladaComRanking = {
  pelada: Pelada;
  ranking: { nome: string; gols: number }[];
};
