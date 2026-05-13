import type { Posicao, ResultadoSorteio } from "@/types/sorteio";
import { FormationChips } from "@/components/sorteio/FormationChips";
import { umaCasaDecimal } from "@/lib/format-notas";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Flame, Shield, Trophy, Zap } from "lucide-react";

interface Props {
  resultado: ResultadoSorteio;
  /** Classes extras na raiz (ex.: `mt-0` dentro de modal). */
  className?: string;
}

function contagemPosicoes(
  jogadores: ResultadoSorteio["times"][0]["jogadores"]
): Record<Posicao, number> {
  const c: Record<Posicao, number> = { ZAG: 0, MEI: 0, ATA: 0 };
  for (const esc of jogadores) {
    c[esc.posicao] += 1;
  }
  return c;
}

export function TimesResultado({ resultado, className }: Props) {
  if (!resultado.times.length) return null;

  const maiorForca = Math.max(...resultado.times.map((t) => t.forcaTotal));
  const menorForca = Math.min(...resultado.times.map((t) => t.forcaTotal));
  const melhorTime = resultado.times.find((t) => t.forcaTotal === maiorForca);

  return (
    <section
      className={cn(
        "mt-4 space-y-3 lg:mt-5 lg:space-y-4 2xl:mt-6 2xl:space-y-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 transition-colors dark:border-slate-800 dark:bg-slate-900/80 lg:px-4 lg:py-3 2xl:px-5 2xl:py-4">
        {melhorTime && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-200">
            <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            Melhor time: <span className="font-semibold text-amber-700 dark:text-amber-300">{melhorTime.nome}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5 2xl:gap-6">
        {resultado.times.map((time) => {
          const destaque =
            time.forcaTotal === maiorForca
              ? "mais-forte"
              : time.forcaTotal === menorForca
              ? "mais-fraco"
              : "neutro";
          const media = time.jogadores.length
            ? umaCasaDecimal(time.forcaTotal / time.jogadores.length)
            : "0.0";
          const timeIncompleto = time.jogadores.length < 5;
          const cont = contagemPosicoes(time.jogadores);

          return (
            <article
              key={time.id}
              className={`card-animate flex flex-col gap-0 overflow-hidden rounded-3xl border bg-white text-xs shadow-md transition-colors dark:bg-slate-900/80 dark:shadow-soft-card lg:text-[13px] 2xl:text-sm ${
                destaque === "mais-forte"
                  ? "border-green-400 dark:border-emerald-400/80"
                  : destaque === "mais-fraco"
                  ? "border-gray-300 dark:border-slate-700"
                  : "border-gray-200 dark:border-slate-800"
              }`}
            >
              <header className="flex items-start justify-between gap-2 border-b border-gray-100 p-3.5 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">{time.nome}</h3>
                    {timeIncompleto && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                        Incompleto · {time.jogadores.length}/5
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    {time.jogadores.length} jogadores · média {media}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 dark:border-emerald-700/50 dark:bg-emerald-950/50 dark:text-emerald-200">
                    <Zap className="h-3 w-3 shrink-0" aria-hidden />
                    Força {umaCasaDecimal(time.forcaTotal)}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                    {cont.ATA} ATK / {cont.MEI} MED / {cont.ZAG} DEF
                  </p>
                </div>
              </header>

              <div className="border-b border-gray-100 px-3.5 py-2 dark:border-slate-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Formação
                </p>
                <div className="mt-1.5">
                  <FormationChips formation={cont} />
                </div>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-slate-400">
                  {cont.ZAG} zagueiro(s) · {cont.MEI} meia(s) · {cont.ATA} atacante(s)
                  {time.formacaoUsada.descricao ? ` · ref.: ${time.formacaoUsada.descricao}` : ""}
                </p>
              </div>

              <ul className="space-y-1.5 p-3 pt-2">
                {time.jogadores.map((esc) => (
                  <li
                    key={esc.jogador.nome + esc.posicao}
                    className="flex items-center gap-2 rounded-2xl bg-gray-50 px-2.5 py-2 transition-colors dark:bg-slate-900/90"
                  >
                    <BadgePosicao posicao={esc.posicao} />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-slate-100">{esc.jogador.nome}</span>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-slate-800 dark:text-emerald-300">
                      Nota {umaCasaDecimal(esc.notaNaPosicao)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BadgePosicao({ posicao }: { posicao: Posicao }) {
  const base =
    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase transition-colors";
  if (posicao === "ZAG") {
    return (
      <span className={`${base} bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300`}>
        <Shield className="h-3 w-3" />
        DEF
      </span>
    );
  }
  if (posicao === "MEI") {
    return (
      <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300`}>
        <ArrowLeftRight className="h-3 w-3" />
        MED
      </span>
    );
  }
  return (
    <span className={`${base} bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300`}>
      <Flame className="h-3 w-3" />
      ATK
    </span>
  );
}
