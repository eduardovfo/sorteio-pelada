"use client";

import { Server } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusServidor = "online" | "offline" | "loading";

const statusConfig = {
  online: {
    wrapper: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
    icon: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/60",
    title: "text-green-900 dark:text-green-200",
    sub: "text-green-700 dark:text-green-300/90",
    dot: "bg-green-500 dark:bg-green-400",
    label: "Servidor online"
  },
  offline: {
    wrapper: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/60",
    icon: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50",
    title: "text-red-900 dark:text-red-200",
    sub: "text-red-700 dark:text-red-300/90",
    dot: "bg-red-500 dark:bg-red-400",
    label: "Servidor offline"
  },
  loading: {
    wrapper: "bg-gray-50 border-gray-200 dark:bg-slate-900/80 dark:border-slate-700",
    icon: "text-gray-500 bg-gray-100 dark:text-slate-400 dark:bg-slate-800",
    title: "text-gray-800 dark:text-slate-100",
    sub: "text-gray-500 dark:text-slate-400",
    dot: "bg-gray-400 animate-pulse dark:bg-slate-500",
    label: "Conectando..."
  }
} as const;

interface ServerStatusProps {
  status: StatusServidor;
  activePlayers: number;
}

export function ServerStatus({ status, activePlayers }: ServerStatusProps) {
  const cfg = statusConfig[status];
  const subLinha =
    status === "loading"
      ? "Carregando lista de jogadores…"
      : status === "offline"
        ? "Sem conexão com o servidor"
        : `${activePlayers} ${activePlayers === 1 ? "jogador ativo" : "jogadores ativos"}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        cfg.wrapper
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          cfg.icon
        )}
      >
        <Server className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", cfg.title)}>{cfg.label}</p>
        <p className={cn("text-xs", cfg.sub)}>{subLinha}</p>
      </div>
      <div
        className={cn("ml-auto h-2 w-2 shrink-0 rounded-full", cfg.dot)}
        aria-hidden
      />
    </div>
  );
}
