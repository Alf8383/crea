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
  label: string;
  href: string;
  section?: MainMenuSection;
}> = [
  { id: "inicio", label: "Inicio", href: "/" },
  { id: "mi-restaurante", label: "Mi restaurante", href: "/negocios/nuevo" },
  {
    id: "diagnostico",
    label: "Mi diagnóstico",
    href: "/negocios?seccion=diagnostico",
    section: "diagnostico",
  },
  {
    id: "simulador",
    label: "Comparador y simulador",
    href: "/negocios?seccion=simulador",
    section: "simulador",
  },
  {
    id: "obligaciones",
    label: "Mis obligaciones",
    href: "/negocios?seccion=obligaciones",
    section: "obligaciones",
  },
  {
    id: "crea-ia",
    label: "Crea IA",
    href: "/negocios?seccion=crea-ia",
    section: "crea-ia",
  },
  {
    id: "orientacion",
    label: "Centro de orientación",
    href: "/negocios?seccion=orientacion",
    section: "orientacion",
  },
  {
    id: "reportes",
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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-base font-black text-white shadow-xs shadow-blue-200 transition group-hover:bg-blue-700">
                C
              </span>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Crea
                </span>
                <span className="ml-2 hidden rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline-block">
                  Restaurantes · Cajamarca
                </span>
              </div>
            </Link>
          </div>

          {/* Right Actions: Restricted Research/Admin Links + Auth */}
          <div className="flex items-center gap-2">
            {rightActions}

            <Link
              href="/investigacion"
              className={
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition " +
                (pathname.startsWith("/investigacion")
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:text-indigo-700")
              }
              title="Módulo de Investigación Académica (36 restaurantes)"
            >
              🎓 Investigación
            </Link>

            <Link
              href="/admin"
              className={
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition " +
                (pathname.startsWith("/admin")
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900")
              }
              title="Panel administrativo restringido"
            >
              ⚙️ Admin
            </Link>

            {account ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white uppercase">
                  {account.name.slice(0, 1)}
                </span>
                <span
                  className="hidden max-w-[110px] truncate text-xs font-bold text-slate-700 md:inline"
                  title={account.email}
                >
                  {account.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/ingresar"
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  Registrar restaurante
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main 8-Section Navigation Bar */}
        <nav
          aria-label="Menú principal del sistema"
          className="mt-2.5 flex items-center gap-1 overflow-x-auto border-t border-slate-100 pt-2"
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

            if (item.section && isDashboardRoute && onSelectSection) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.section!)}
                  className={
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition " +
                    (isActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                  }
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition " +
                  (isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
