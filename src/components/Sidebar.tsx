"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBallFootball,
  IconDotsVertical,
  IconLayoutDistributeHorizontal
} from "@tabler/icons-react";
import { cn, getInitials } from "@/lib/utils";

type NavIcon = typeof IconLayoutDistributeHorizontal;

interface NavItemConfig {
  href: string;
  icon: NavIcon;
  label: string;
  badge?: number;
}

interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
}

const navGroups: NavGroupConfig[] = [
  {
    label: "Pelada",
    items: [
      { href: "/sorteio", icon: IconLayoutDistributeHorizontal, label: "Sorteio" }
      // Temporariamente oculto:
      // { href: "/gols", icon: IconBallFootball, label: "Gols" },
      // { href: "/artilharia", icon: IconTrophy, label: "Artilharia" }
    ]
  }
];

function SidebarLogo() {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-4 dark:border-gray-800">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600 dark:bg-green-600">
        <IconBallFootball size={16} className="text-white" aria-hidden />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Pelada da</p>
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Babilônia</p>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: NavItemConfig;
}

function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-green-50 font-medium text-green-800 dark:bg-green-950 dark:text-green-300"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      )}
    >
      <Icon
        size={17}
        className={cn("shrink-0", isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavGroup({ group }: { group: NavGroupConfig }) {
  if (!group.items.length) return null;
  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

function SidebarUser() {
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { admin?: boolean }) => {
        if (!cancel) setAdmin(Boolean(data?.admin));
      })
      .catch(() => {
        if (!cancel) setAdmin(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const name = admin ? "Administrador" : "Convidado";
  const role = admin ? "Admin" : "Membro";

  return (
    <div className="shrink-0 border-t border-gray-100 px-2 py-3 dark:border-gray-800">
      <button
        type="button"
        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-[11px] font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
          {admin === null ? "…" : getInitials(name)}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{name}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{role}</p>
        </div>
        <IconDotsVertical
          size={15}
          className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
          aria-hidden
        />
      </button>
    </div>
  );
}

export function Sidebar() {
  const groups = navGroups.filter((g) => g.items.length > 0);

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-52 flex-col border-r border-gray-100 bg-white transition-colors dark:border-gray-800 dark:bg-gray-950 lg:flex"
      aria-label="Navegação principal"
    >
      <SidebarLogo />
      <nav className="flex flex-1 flex-col space-y-4 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <NavGroup key={group.label} group={group} />
        ))}
      </nav>
      <SidebarUser />
    </aside>
  );
}
