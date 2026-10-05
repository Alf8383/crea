"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { activateAccount, activateDemoAccount, saveDemoAccount } from "@/lib/account-storage";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const data = new FormData(event.currentTarget); const email = String(data.get("email")); const password = String(data.get("password"));
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      if (isRegister) {
        const created = saveDemoAccount(email, String(data.get("name") || "Emprendedor"));
        if (!created) { setMessage("Ya existe una cuenta de demostración con ese correo. Inicia sesión para abrir sus datos."); setLoading(false); return; }
      } else if (!activateDemoAccount(email)) {
        setMessage("No encontramos una cuenta de demostración con ese correo. Crea una cuenta primero."); setLoading(false); return;
      }
      router.push("/negocios"); return;
    }
    const result = isRegister ? await supabase.auth.signUp({ email, password, options: { data: { full_name: data.get("name") } } }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setMessage(result.error.message); setLoading(false); return; }
    activateAccount(email);
    router.push("/negocios");
  }

  return <main className="min-h-screen bg-[#edf5fb] text-[#071c56]"><nav className="flex items-center justify-between border-b border-blue-100 bg-white px-6 py-5 sm:px-14"><Link href="/" className="text-4xl font-black tracking-tight text-[#0a318c]">Crea</Link><div className="flex gap-4 text-sm font-semibold"><Link href="/" className="rounded-xl px-3 py-3">Inicio</Link><Link href={isRegister?"/ingresar":"/registro"} className="rounded-xl bg-[#1464f6] px-5 py-3 text-white">{isRegister?"Iniciar sesión":"Crear cuenta"}</Link></div></nav><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-2"><section className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-7 sm:p-10"><div className="grid h-72 place-items-center rounded-3xl bg-white/55 text-9xl" aria-hidden="true">✦</div><h1 className="mt-8 max-w-md text-4xl font-black leading-tight">Un solo lugar para ordenar tu idea de negocio</h1><div className="mt-7 space-y-5">{[["Fácil de usar","Preguntas claras y un paso a la vez."],["Información trazable","Enlaces a fuentes oficiales."],["A tu ritmo","Retoma tu evaluación cuando quieras."]].map(([title,copy])=><div key={title} className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-600">✓</span><div><h2 className="font-bold">{title}</h2><p className="text-slate-600">{copy}</p></div></div>)}</div></section><section className="rounded-3xl bg-white p-7 shadow-xl shadow-blue-100 sm:p-11"><h2 className="text-4xl font-black">{isRegister?"Crea tu cuenta":"Bienvenido de nuevo"}</h2><p className="mt-2 text-lg text-slate-600">{isRegister?"Comienza tu ruta hacia la formalización.":"Retoma tu ruta y tus respuestas guardadas."}</p><form onSubmit={submit} className="mt-9 space-y-5">{isRegister&&<label className="block font-semibold text-slate-600">Nombre completo<input required name="name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-4 outline-none focus:border-[#1464f6]" placeholder="Tu nombre" /></label>}<label className="block font-semibold text-slate-600">Correo electrónico<input required name="email" type="email" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-4 outline-none focus:border-[#1464f6]" placeholder="tucorreo@ejemplo.com" /></label><label className="block font-semibold text-slate-600">Contraseña<input required name="password" minLength={6} type="password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-4 outline-none focus:border-[#1464f6]" placeholder="Mínimo 6 caracteres" /></label>{message&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#1464f6] px-4 py-4 text-lg font-bold text-white disabled:opacity-60">{loading?"Un momento…":isRegister?"Crear cuenta":"Iniciar sesión"}</button></form><p className="mt-7 text-center text-slate-600">{isRegister?"¿Ya tienes una cuenta?":"¿Aún no tienes una cuenta?"} <Link className="font-bold text-[#1464f6]" href={isRegister?"/ingresar":"/registro"}>{isRegister?"Inicia sesión":"Créala"}</Link></p><p className="mt-8 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-slate-600">Sin Supabase, las cuentas son demostraciones locales: los datos se separan por correo en este navegador, pero la contraseña no se valida ni se crea una cuenta real.</p></section></div></main>;
}
