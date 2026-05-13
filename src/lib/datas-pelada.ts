/** Fuso usado para “dia da pelada” (quarta no Brasil). */
export const FUSO_PELADA = "America/Sao_Paulo";

/** Data local em ISO YYYY-MM-DD (sem timezone). */
export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Próxima ocorrência de quarta-feira a partir de `agora` (inclusive).
 * Se hoje for quarta, retorna hoje.
 */
export function proximaQuartaFeiraDesde(agora: Date = new Date()): string {
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dow = d.getDay();
  const target = 3;
  let add = (target - dow + 7) % 7;
  d.setDate(d.getDate() + add);
  return toISODateLocal(d);
}

/**
 * Verifica se `YYYY-MM-DD` é uma quarta-feira válida no fuso local (Brasil).
 */
export function isQuartaFeiraLocal(iso: string): boolean {
  const s = iso.trim().slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, month, day);
  if (d.getFullYear() !== y || d.getMonth() !== month || d.getDate() !== day) {
    return false;
  }
  return d.getDay() === 3;
}

/** “Hoje” no calendário da pelada (YYYY-MM-DD em `FUSO_PELADA`). */
export function hojeEmFusoPelada(agora: Date = new Date()): string {
  return agora.toLocaleDateString("en-CA", { timeZone: FUSO_PELADA });
}

/**
 * A data civil `YYYY-MM-DD` cai em uma quarta-feira em `FUSO_PELADA`.
 * Usa um instante ao meio-dia UTC do dia para evitar borda de fuso.
 */
export function isQuartaEmFusoPelada(iso: string): boolean {
  const s = iso.trim().slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const instant = new Date(Date.UTC(y, mo, d, 12, 0, 0));
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_PELADA,
    weekday: "short",
  }).format(instant);
  return wd === "Wed";
}
