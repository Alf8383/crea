"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ACTIVE_ACCOUNT_KEY, getDemoAccounts, type LocalAccount } from "@/lib/account-storage";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AppHeader({
  admin = false,
  rightActions,
}: {
  admin?: boolean;
  rightActions?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState<LocalAccount | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!activeId) return;
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
      const supabase = getSupabaseBrowser();
      if (supabase) await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    setAccount(null);
    router.push("/");
  };

  const navItems = [
    { href: "/", label: "Inicio", match: (p: string) => p === "/" },
    { href: "/negocios/nuevo", label: "Cuestionario", match: (p: string) => p.startsWith("/negocios/nuevo") },
    {
      href: "/negocios/demo/ruta",
      label: "Ruta y Simulador",
      match: (p: string) => p.includes("/ruta") || p.startsWith("/requisitos"),
    },
    { href: "/negocios", label: "Mi espacio", match: (p: string) => p === "/negocios" },
    ...(admin ? [{ href: "/admin", label: "Catálogo", match: (p: string) => p.startsWith("/admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-base font-black text-white shadow-sm shadow-blue-200 transition group-hover:bg-blue-700">
              C
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Crea</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl bg-slate-100/80 p-1 md:flex" aria-label="Navegación principal">
            {navItems.map((item) => {
              const active = item.match(pathname || "");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition " +
                    (active
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {rightActions}

          {account ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white uppercase">
                {account.name.slice(0, 1)}
              </span>
              <span className="max-w-[120px] truncate text-xs font-bold text-slate-700" title={account.email}>
                {account.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="ml-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Salir
              </button>
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

      {/* Mobile navigation row */}
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden" aria-label="Navegación móvil">
        {navItems.map((item) => {
          const active = item.match(pathname || "");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold " +
                (active ? "bg-blue-600 text-white" : "text-slate-600")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
