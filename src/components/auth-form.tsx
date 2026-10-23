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
          setMessage("Ya existe una cuenta registrada con ese correo en este navegador. Inicia sesión para continuar.");
          setLoading(false);
          return;
        }
      } else if (!activateDemoAccount(email)) {
        setMessage("No encontramos una cuenta con ese correo en este navegador. Crea una cuenta primero.");
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
    <main className="min-h-screen bg-[#edf5fb] text-[#071c56]">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-white px-6 py-5 sm:px-14">
        <Link href="/" className="text-4xl font-black tracking-tight text-[#0a318c]">
          Crea
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link href="/" className="rounded-xl px-3 py-2.5 text-slate-600 hover:bg-blue-50 hover:text-[#0a318c]">
            Inicio
          </Link>
          <Link href="/negocios/nuevo" className="rounded-xl border border-blue-200 px-4 py-2.5 text-[#1464f6] hover:bg-blue-50">
            Ir al cuestionario
          </Link>
          <Link href={isRegister ? "/ingresar" : "/registro"} className="rounded-xl bg-[#1464f6] px-5 py-2.5 text-white hover:bg-blue-700">
            {isRegister ? "Iniciar sesión" : "Crear cuenta"}
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <section className="rounded-3xl bg-gradient-to-br from-[#0a318c] to-[#1464f6] p-7 text-white shadow-xl shadow-blue-200/60 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200">
            ✦ Guía tributaria y de formalización
          </span>
          <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
            Descubre tu régimen tributario ideal y tu ruta de formalización en minutos
          </h1>
          <p className="mt-3 text-base leading-relaxed text-blue-100">
            Al crear tu cuenta pasarás directamente al cuestionario guiado para evaluar tu negocio en Cajamarca o cualquier región del Perú.
          </p>

          <div className="mt-7 space-y-4">
            {[
              ["Paso 1 · Cuestionario guiado", "Responde preguntas sencillas sobre tu actividad, ventas estimadas y forma de trabajo."],
              ["Paso 2 · Comparador y simulador SUNAT", "Compara Nuevo RUS, RER, RMT y Régimen General con cálculo aproximado de impuestos mensuales."],
              ["Paso 3 · Ruta y herramientas prácticas", "Revisa tus requisitos paso a paso (RUC, SUNARP, Licencia Municipal, ITSE) con fuentes oficiales."],
            ].map(([title, copy], idx) => (
              <div key={title} className="flex gap-3.5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-400 text-sm font-black text-[#071c56]">
                  {idx + 1}
                </span>
                <div>
                  <h2 className="font-bold text-white">{title}</h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-blue-100">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-xl shadow-blue-100 sm:p-11">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1464f6]">
              {isRegister ? "Nuevo emprendedor" : "Acceso a tu cuenta"}
            </span>
            <Link href="/negocios/nuevo" className="text-xs font-bold text-slate-500 underline hover:text-[#1464f6]">
              Continuar sin cuenta →
            </Link>
          </div>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">{isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h2>
          <p className="mt-2 text-base text-slate-600">
            {isRegister
              ? "Regístrate y te llevaremos directamente al cuestionario de tu negocio."
              : "Ingresa tu correo para retomar tu diagnóstico o iniciar una nueva evaluación."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isRegister && (
              <label className="block text-sm font-bold text-[#10295b]">
                Nombre completo
                <input
                  required
                  name="name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-base font-normal outline-none transition focus:border-[#1464f6] focus:ring-4 focus:ring-blue-100"
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
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-base font-normal outline-none transition focus:border-[#1464f6] focus:ring-4 focus:ring-blue-100"
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
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-base font-normal outline-none transition focus:border-[#1464f6] focus:ring-4 focus:ring-blue-100"
                placeholder="Mínimo 6 caracteres"
              />
            </label>

            {message && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#1464f6] px-4 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Un momento…" : isRegister ? "Crear cuenta e ir al cuestionario →" : "Iniciar sesión →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}{" "}
            <Link className="font-bold text-[#1464f6] hover:underline" href={isRegister ? "/ingresar" : "/registro"}>
              {isRegister ? "Inicia sesión" : "Créala gratis"}
            </Link>
          </p>

          <p className="mt-6 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500">
            Tus respuestas y avances se guardan asociados a tu correo para que puedas retomar tu evaluación en cualquier momento.
          </p>
        </section>
      </div>
    </main>
  );
}
