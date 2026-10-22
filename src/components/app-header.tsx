"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIVE_ACCOUNT_KEY, getDemoAccounts, type LocalAccount } from "@/lib/account-storage";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AppHeader({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [account, setAccount] = useState<LocalAccount | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!activeId) return;
        const found = getDemoAccounts().find((item) => item.id === activeId);
        if (found) setAccount(found);
        else setAccount({ id: activeId, email: decodeURIComponent(activeId), name: decodeURIComponent(activeId).split("@")[0] });
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowser();
      if (supabase) await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    setAccount(null);
    router.push("/");
  };

  return (
    <header className="border-b border-blue-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link href="/" className="text-3xl font-black tracking-tight text-[#0a318c]">
          Crea
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#10295b]">
          <Link className="rounded-lg px-3 py-2 hover:bg-blue-50" href="/negocios">
            Mi espacio
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-blue-50" href="/negocios/demo/ruta">
            Mi ruta
          </Link>
          {admin && (
            <Link className="rounded-lg bg-blue-50 px-3 py-2 text-[#1464f6]" href="/admin">
              Administración
            </Link>
          )}
          <Link className="rounded-lg px-3 py-2 hover:bg-blue-50" href="/">
            Inicio
          </Link>
          {account ? (
            <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1464f6]" title={account.email}>
                👤 {account.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link className="ml-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#1464f6] hover:bg-blue-50" href="/ingresar">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
