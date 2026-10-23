"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  activateAccount,
  activateDemoAccount,
  getDemoAccounts,
  saveDemoAccount,
  scopedStorageKey,
  type LocalAccount,
} from "@/lib/account-storage";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"login" | "register">(mode);
  const [savedAccounts, setSavedAccounts] = useState<LocalAccount[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = activeMode === "register";

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setSavedAccounts(getDemoAccounts());
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function redirectAfterAuth(fromRegister: boolean) {
    try {
      const hasSavedContext = Boolean(localStorage.getItem(scopedStorageKey("efp-business-context")));
      if (hasSavedContext && !fromRegister) {
        router.push("/negocios/demo/ruta");
        return;
      }
    } catch {}
    router.push("/negocios/nuevo");
  }

  function quickSignIn(account: LocalAccount) {
    activateDemoAccount(account.email);
    redirectAfterAuth(false);
  }

  function startInstantDemoAccount() {
    const demoEmail = "emprendedor@crea.pe";
    const exists = getDemoAccounts().some((item) => item.email === demoEmail);
    if (!exists) {
      saveDemoAccount(demoEmail, "Emprendedor Demo");
    } else {
      activateDemoAccount(demoEmail);
    }
    router.push("/negocios/nuevo");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim() || email.split("@")[0] || "Emprendedor";
    const supabase = getSupabaseBrowser();

    if (!supabase) {
      if (isRegister) {
        const created = saveDemoAccount(email, name);
        if (!created) {
          // If it already exists locally, seamlessly sign them in instead of blocking!
          activateDemoAccount(email);
          redirectAfterAuth(false);
          return;
        }
      } else {
        const activated = activateDemoAccount(email);
        if (!activated) {
          // Auto-create if not found locally so the user never hits a frustrating dead end
          saveDemoAccount(email, name);
        }
      }
      redirectAfterAuth(isRegister);
      return;
    }

    const result = isRegister
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }
    activateAccount(email);
    redirectAfterAuth(isRegister);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[440px]">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] sm:p-8">
            {/* Instant Mode Switcher */}
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("login");
                  setMessage("");
                }}
                className={
                  "rounded-xl py-2.5 transition " +
                  (!isRegister ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-900")
                }
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode("register");
                  setMessage("");
                }}
                className={
                  "rounded-xl py-2.5 transition " +
                  (isRegister ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-900")
                }
              >
                Crear cuenta
              </button>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {isRegister ? "Crea tu perfil en Crea" : "Accede a tu espacio"}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {isRegister
                  ? "Guarda tu diagnóstico e irás directo al cuestionario de tu negocio."
                  : "Continúa con tu evaluación o revisa tu simulación tributaria."}
              </p>
            </div>

            {/* Saved accounts 1-click access when in login mode */}
            {!isRegister && savedAccounts.length > 0 && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Cuentas recientes en este navegador
                </p>
                <div className="mt-2 space-y-1.5">
                  {savedAccounts.slice(0, 3).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => quickSignIn(acc)}
                      className="flex w-full items-center justify-between rounded-xl border border-white bg-white px-3 py-2 text-left text-xs shadow-2xs transition hover:border-blue-300"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase">
                          {acc.name.slice(0, 1)}
                        </span>
                        <span className="truncate font-bold text-slate-800">{acc.name}</span>
                        <span className="truncate text-slate-400">({acc.email})</span>
                      </span>
                      <span className="shrink-0 font-bold text-blue-600">Entrar →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              {isRegister && (
                <label className="block text-xs font-bold text-slate-700">
                  Tu nombre
                  <input
                    required
                    name="name"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                    placeholder="Ej. Alessandro o Esmeralda"
                  />
                </label>
              )}

              <label className="block text-xs font-bold text-slate-700">
                Correo electrónico
                <input
                  required
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  placeholder="nombre@correo.com"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Contraseña
                <input
                  required
                  name="password"
                  minLength={4}
                  type="password"
                  defaultValue="123456"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  placeholder="••••••••"
                />
              </label>

              {message && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {message}
                </p>
              )}

              <button
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading
                  ? "Ingresando…"
                  : isRegister
                  ? "Crear cuenta e ir al cuestionario →"
                  : "Continuar →"}
              </button>
            </form>

            <div className="relative my-5 flex items-center justify-center">
              <span className="w-full border-t border-slate-100" />
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                o acceso directo
              </span>
              <span className="w-full border-t border-slate-100" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={startInstantDemoAccount}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                ⚡ Cuenta demo en 1 clic
              </button>
              <Link
                href="/negocios/nuevo"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Continuar como invitado →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
