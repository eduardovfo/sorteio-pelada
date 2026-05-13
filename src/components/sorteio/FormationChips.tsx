"use client";

import type { Posicao } from "@/types/sorteio";
import { ArrowLeftRight, Flame, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Chips por posição (ZAG→DEF, MEI→MID, ATA→ATK) com cores alinhadas às badges de jogador. */
const positionConfig: Record<
  Posicao,
  { label: string; bg: string; text: string; icon: LucideIcon }
> = {
  ZAG: {
    label: "DEF",
    bg: "bg-green-100 dark:bg-green-950/50",
    text: "text-green-800 dark:text-green-300",
    icon: Shield
  },
  MEI: {
    label: "MED",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    icon: ArrowLeftRight
  },
  ATA: {
    label: "ATK",
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-800 dark:text-red-300",
    icon: Flame
  }
};

interface FormationChipsProps {
  /** Contagem por posição (ex.: distribuição da formação). */
  formation: Record<Posicao, number>;
}

export function FormationChips({ formation }: FormationChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(formation) as [Posicao, number][])
        .filter(([, count]) => count > 0)
        .map(([pos, count]) => {
        const cfg = positionConfig[pos];
        const Icon = cfg.icon;
        return (
          <span
            key={pos}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {count} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}
