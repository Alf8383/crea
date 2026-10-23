"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ACTIVE_ACCOUNT_KEY, getDemoAccounts, scopedStorageKey, type LocalAccount } from "@/lib/account-storage";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AppHeader({
  rightActions,
}: {
  admin?: boolean;
  rightActions?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [hasSavedContext, setHasSavedContext] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!activeId) {
          setAccount(null);
          setHasSavedContext(false);
          return;
        }
        const found = getDemoAccounts().find((item) => item.id === activeId);
        if (found) setAccount(found);
        else {
          const email = decodeURIComponent(activeId);
          setAccount({ id: activeId, email, name: email.split("@")[0] });
        }
        setHasSavedContext(Boolean(localStorage.getItem(scopedStorageKey("efp-business-context"))));
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowser();
      if (supabase) await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    setAccount(null);
    router.push("/");
  };

  const isPublicPage = pathname === "/" || pathname === "/ingresar" || pathname === "/registro";
  const dashboardHref = hasSavedContext ? "/negocios/demo/ruta" : "/negocios";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        {/* Left: Brand & Context Navigation */}
        <div className="flex items-center gap-6">
          <Link href={account ? dashboardHref : "/"} className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-base font-black text-white shadow-xs shadow-blue-200 transition group-hover:bg-blue-700">
              C
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Crea</span>
          </Link>

          {isPublicPage ? (
            pathname === "/" && (
              <nav className="hidden items-center gap-6 text-xs font-bold text-slate-600 md:flex" aria-label="Secciones de inicio">
                <a href="#simulador" className="transition hover:text-blue-600">
                  Calculadora rápida
                </a>
                <a href="#como-funciona" className="transition hover:text-blue-600">
                  ¿Cómo funciona?
                </a>
                <a href="#preguntas" className="transition hover:text-blue-600">
                  Preguntas frecuentes
                </a>
              </nav>
            )
          ) : (
            <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" aria-label="Navegación del panel">
              <Link
                href={dashboardHref}
                className={
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition " +
                  (pathname === "/negocios" || pathname.includes("/ruta") || pathname.startsWith("/requisitos")
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900")
                }
              >
                <span>📊</span>
                <span>Mi Panel</span>
              </Link>
              <Link
                href="/negocios/nuevo"
                className={
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition " +
                  (pathname.startsWith("/negocios/nuevo")
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900")
                }
              >
                <span>📝</span>
                <span>Cuestionario</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right: Actions & Auth State */}
        <div className="flex items-center gap-2.5">
          {rightActions}

          {account ? (
            <div className="flex items-center gap-2">
              {isPublicPage && (
                <Link
                  href={dashboardHref}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  Ir a mi panel →
                </Link>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white uppercase">
                  {account.name.slice(0, 1)}
                </span>
                <span className="hidden max-w-[130px] truncate text-xs font-bold text-slate-700 sm:inline" title={account.email}>
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
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/ingresar"
                className={
                  "rounded-xl px-3.5 py-2 text-xs font-bold transition " +
                  (pathname === "/ingresar"
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                }
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-blue-200 transition hover:bg-blue-700"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
