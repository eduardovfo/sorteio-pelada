/** Arredonda para 1 casa decimal (evita 0.3000000000000007 em floats). */
export function arredondaUmaCasa(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

/** Texto com sempre uma casa decimal. */
export function umaCasaDecimal(n: number): string {
  return arredondaUmaCasa(n).toFixed(1);
}
