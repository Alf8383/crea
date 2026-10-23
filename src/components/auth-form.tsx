"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { activateAccount, activateDemoAccount, saveDemoAccount, scopedStorageKey } from "@/lib/account-storage";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  function redirectAfterAuth() {
    try {
      const hasSavedContext = Boolean(localStorage.getItem(scopedStorageKey("efp-business-context")));
      if (hasSavedContext && !isRegister) {
        router.push("/negocios/demo/ruta");
        return;
      }
    } catch {}
    router.push("/negocios/nuevo");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const supabase = getSupabaseBrowser();

    if (!supabase) {
      if (isRegister) {
        const created = saveDemoAccount(email, String(data.get("name") || "Emprendedor"));
        if (!created) {
          setMessage("Ese correo ya está registrado en este navegador. Cambia a «Iniciar sesión».");
          setLoading(false);
          return;
        }
      } else if (!activateDemoAccount(email)) {
        setMessage("No encontramos ese correo en este navegador. Crea tu cuenta primero.");
        setLoading(false);
        return;
      }
      redirectAfterAuth();
      return;
    }

    const result = isRegister
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: data.get("name") } } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }
    activateAccount(email);
    redirectAfterAuth();
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#edf5fb] to-[#e2effa] text-[#071c56]">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-3xl font-black tracking-tight text-[#0a318c]">
          Crea
        </Link>
        <Link
          href="/"
          className="rounded-xl bg-white/80 px-4 py-2 text-sm font-bold text-[#10295b] shadow-sm backdrop-blur transition hover:bg-white"
        >
          ← Volver al inicio
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <section className="w-full max-w-md rounded-[28px] border border-white bg-white p-7 shadow-[0_20px_60px_rgba(11,53,117,0.10)] sm:p-9">
          {/* Interactive Switcher Pills */}
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-center text-sm font-bold">
            <Link
              href="/ingresar"
              className={
                "rounded-xl py-2.5 transition " +
                (!isRegister ? "bg-white text-[#1464f6] shadow-sm" : "text-slate-500 hover:text-[#071c56]")
              }
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className={
                "rounded-xl py-2.5 transition " +
                (isRegister ? "bg-white text-[#1464f6] shadow-sm" : "text-slate-500 hover:text-[#071c56]")
              }
            >
              Crear cuenta
            </Link>
          </div>

          <div className="mt-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl text-[#1464f6]">
              {isRegister ? "✦" : "👋"}
            </div>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              {isRegister ? "Empieza tu ruta" : "¡Qué gusto verte!"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isRegister
                ? "Crea tu cuenta en segundos e irás directo al cuestionario."
                : "Ingresa para retomar tu evaluación guardada."}
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && (
              <label className="block text-sm font-bold text-[#10295b]">
                ¿Cómo te llamas?
                <input
                  required
                  name="name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#1464f6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Ej. María Rojas"
                />
              </label>
            )}
            <label className="block text-sm font-bold text-[#10295b]">
              Correo electrónico
              <input
                required
                name="email"
                type="email"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#1464f6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>
            <label className="block text-sm font-bold text-[#10295b]">
              Contraseña
              <input
                required
                name="password"
                minLength={6}
                type="password"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#1464f6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Mínimo 6 caracteres"
              />
            </label>

            {message && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#1464f6] px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Cargando…" : isRegister ? "Crear cuenta y comenzar →" : "Entrar a mi ruta →"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <Link
              href="/negocios/nuevo"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-[#1464f6]"
            >
              Prefiero ir directo al cuestionario sin cuenta →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
