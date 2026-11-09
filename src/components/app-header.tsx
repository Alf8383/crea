"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ACTIVE_ACCOUNT_KEY,
  getDemoAccounts,
  type LocalAccount,
} from "@/lib/account-storage";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

export type MainMenuSection =
  | "diagnostico"
  | "simulador"
  | "obligaciones"
  | "crea-ia"
  | "orientacion"
  | "reportes";

export const MAIN_MENU_ITEMS: Array<{
  id: string;
  icon: string;
  label: string;
  href: string;
  section?: MainMenuSection;
}> = [
  { id: "inicio", icon: "🏠", label: "Inicio", href: "/" },
  {
    id: "mi-restaurante",
    icon: "🍽️",
    label: "Mi restaurante",
    href: "/negocios/nuevo",
  },
  {
    id: "diagnostico",
    icon: "🩺",
    label: "Mi diagnóstico",
    href: "/negocios?seccion=diagnostico",
    section: "diagnostico",
  },
  {
    id: "simulador",
    icon: "🧮",
    label: "Comparador y simulador",
    href: "/negocios?seccion=simulador",
    section: "simulador",
  },
  {
    id: "obligaciones",
    icon: "📅",
    label: "Mis obligaciones",
    href: "/negocios?seccion=obligaciones",
    section: "obligaciones",
  },
  {
    id: "crea-ia",
    icon: "🤖",
    label: "Crea IA",
    href: "/negocios?seccion=crea-ia",
    section: "crea-ia",
  },
  {
    id: "orientacion",
    icon: "📚",
    label: "Centro de orientación",
    href: "/negocios?seccion=orientacion",
    section: "orientacion",
  },
  {
    id: "reportes",
    icon: "📄",
    label: "Mis reportes",
    href: "/negocios?seccion=reportes",
    section: "reportes",
  },
];

export function AppHeader({
  rightActions,
  activeSection,
  onSelectSection,
}: {
  admin?: boolean;
  rightActions?: ReactNode;
  activeSection?: MainMenuSection;
  onSelectSection?: (section: MainMenuSection) => void;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [account, setAccount] = useState<LocalAccount | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!activeId) {
          setAccount(null);
          return;
        }
        const found = getDemoAccounts().find((item) => item.id === activeId);
        if (found) setAccount(found);
        else {
          const email = decodeURIComponent(activeId);
          setAccount({ id: activeId, email, name: email.split("@")[0] });
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch {}
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    setAccount(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {/* Top Row: Brand & Secondary / Auth Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm shadow-blue-200 transition group-hover:bg-blue-700">
              C
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold leading-none tracking-tight text-slate-900">
                  Crea
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  Restaurantes · Cajamarca
                </span>
              </div>
              <span className="mt-0.5 hidden text-[11px] font-medium text-slate-500 sm:inline">
                Orientación, diagnóstico y organización tributaria
              </span>
            </div>
          </Link>

          {/* Right Actions: Research, Admin & User Session */}
          <div className="flex flex-wrap items-center gap-2">
            {rightActions}

            <Link
              href="/investigacion"
              className={
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition " +
                (pathname.startsWith("/investigacion")
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700")
              }
            >
              <span>🎓</span>
              <span>Investigación (36)</span>
            </Link>

            <Link
              href="/admin"
              className={
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition " +
                (pathname.startsWith("/admin")
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100")
              }
            >
              <span>⚙️</span>
              <span>Admin</span>
            </Link>

            {account ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white uppercase">
                  {account.name.slice(0, 1)}
                </span>
                <span
                  className="max-w-[120px] truncate text-xs font-bold text-slate-700"
                  title={account.email}
                >
                  {account.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/ingresar"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: 8 Main Modules Navigation (Wraps cleanly, never cuts off) */}
        <nav
          aria-label="Menú principal del sistema"
          className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5"
        >
          {MAIN_MENU_ITEMS.map((item) => {
            const isDashboardRoute =
              pathname === "/negocios" || pathname.includes("/ruta");
            const isActive =
              item.id === "inicio"
                ? pathname === "/"
                : item.id === "mi-restaurante"
                  ? pathname.startsWith("/negocios/nuevo")
                  : isDashboardRoute && activeSection === item.section;

            const itemClasses =
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition " +
              (isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900");

            if (item.section && isDashboardRoute && onSelectSection) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.section!)}
                  className={itemClasses}
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.id} href={item.href} className={itemClasses}>
                <span className="text-sm leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
