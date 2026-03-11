import type { Posicao, ResultadoSorteio } from "@/types/sorteio";
import { Flame, Scale, Trophy } from "lucide-react";
import { Shield, Sparkles, Zap } from "lucide-react";

interface Props {
  resultado: ResultadoSorteio;
}

function BadgePosicao({ posicao }: { posicao: Posicao }) {
  const base = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase transition-colors";
  if (posicao === "ZAG") {
    return (
      <span className={`${base} bg-blue-100 text-blue-700 dark:bg-sky-900/70 dark:text-sky-100`}>
        <Shield className="h-3 w-3" />
        {posicao}
      </span>
    );
  }
  if (posicao === "MEI") {
    return (
      <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-100`}>
        <Sparkles className="h-3 w-3" />
        {posicao}
      </span>
    );
  }
  return (
    <span className={`${base} bg-green-100 text-green-700 dark:bg-emerald-900/70 dark:text-emerald-100`}>
      <Zap className="h-3 w-3" />
      {posicao}
    </span>
  );
}

export function TimesResultado({ resultado }: Props) {
  if (!resultado.times.length) return null;

  const maiorForca = Math.max(...resultado.times.map((t) => t.forcaTotal));
  const menorForca = Math.min(...resultado.times.map((t) => t.forcaTotal));
  const melhorTime = resultado.times.find((t) => t.forcaTotal === maiorForca);

  return (
    <section className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 transition-colors dark:border-slate-800 dark:bg-slate-900/80">
        {melhorTime && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-200">
            <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            Melhor time: <span className="font-semibold text-amber-700 dark:text-amber-300">{melhorTime.nome}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <Scale className="h-4 w-4 text-green-500 dark:text-emerald-400" />
          Diferença: <span className="font-semibold text-green-700 dark:text-emerald-300">{resultado.diferencaForca}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] text-green-800 dark:bg-emerald-500/10 dark:text-emerald-200">
          Equilíbrio{" "}
          <span className="font-semibold">
            {resultado.diferencaForca <= 2 ? "excelente" : resultado.diferencaForca <= 4 ? "muito bom" : "ok"}
          </span>
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {resultado.times.map((time) => {
          const destaque =
            time.forcaTotal === maiorForca
              ? "mais-forte"
              : time.forcaTotal === menorForca
              ? "mais-fraco"
              : "neutro";
          const media = time.jogadores.length ? (time.forcaTotal / time.jogadores.length).toFixed(1) : "0";

          return (
            <article
              key={time.id}
              className={`card-animate flex flex-col gap-2 rounded-3xl border bg-white p-3.5 text-xs shadow-md transition-colors dark:bg-slate-900/80 dark:shadow-soft-card ${
                destaque === "mais-forte"
                  ? "border-green-400 dark:border-emerald-400/80"
                  : destaque === "mais-fraco"
                  ? "border-gray-300 dark:border-slate-700"
                  : "border-gray-200 dark:border-slate-800"
              }`}
            >
              <header className="flex flex-col gap-1 border-b border-gray-200 pb-2 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">{time.nome}</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-100 px-2.5 py-1.5 text-sm font-bold text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Flame className="h-4 w-4" />
                    FORÇA: {time.forcaTotal}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                  <span>Média do time: <span className="font-semibold text-gray-800 dark:text-slate-200">{media}</span></span>
                  <span>·</span>
                  <span>{time.formacaoUsada.descricao}</span>
                </div>
                {destaque !== "neutro" && (
                  <span
                    className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      destaque === "mais-forte"
                        ? "bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {destaque === "mais-forte" ? "Time mais forte" : "Time mais leve"}
                  </span>
                )}
              </header>

              <ul className="mt-1 space-y-1.5">
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
                      Nota {esc.notaNaPosicao}
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
