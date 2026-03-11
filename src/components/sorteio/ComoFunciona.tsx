import { Info } from "lucide-react";

export function ComoFunciona() {
  return (
    <section className="card-animate mt-3 rounded-3xl border border-gray-200 bg-white p-3 text-[11px] text-gray-600 transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-200">
          <Info className="h-3 w-3" />
        </span>
        <h2 className="text-xs font-semibold tracking-wide text-gray-900 dark:text-slate-200">
          Como funciona o sorteio
        </h2>
      </div>
      <p className="leading-snug">
        O sistema tenta montar times de 5 jogadores usando primeiro a formação{" "}
        <span className="font-semibold text-gray-900 dark:text-slate-100">2 ZAG / 1 MEI / 2 ATA</span>. Em
        seguida, ele testa várias combinações possíveis, sempre equilibrando as
        notas dos jogadores nas posições escolhidas. São feitas diversas
        simulações internas e a melhor distribuição é selecionada com base na
        diferença de força entre os times e na proximidade com as formações
        ideais.
      </p>
    </section>
  );
}
