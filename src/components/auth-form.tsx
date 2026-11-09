"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { AppHeader } from "@/components/app-header";
import {
  activateAccount,
  activateDemoAccount,
  getDemoAccounts,
  saveDemoAccount,
  scopedStorageKey,
  type LocalAccount,
} from "@/lib/account-storage";
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase/client";

function getErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Este correo ya está registrado. Por favor, inicia sesión.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Correo o contraseña incorrectos.";
    case "auth/user-not-found":
      return "No existe una cuenta con este correo.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "El formato de correo no es válido.";
    case "auth/popup-closed-by-user":
      return "";
    default:
      return error.message || "Ocurrió un error al procesar tu solicitud.";
  }
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"login" | "register">(mode);
  const [savedAccounts, setSavedAccounts] = useState<LocalAccount[]>([]);
  const [requiresSessionNotice, setRequiresSessionNotice] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(false);
  const isRegister = activeMode === "register";

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setFirebaseActive(isFirebaseConfigured());
        setSavedAccounts(getDemoAccounts());
        const params = new URLSearchParams(window.location.search);
        if (params.get("requiere") === "sesion") {
          setRequiresSessionNotice(true);
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function redirectAfterAuth(fromRegister: boolean) {
    try {
      const hasSavedContext = Boolean(
        localStorage.getItem(scopedStorageKey("efp-business-context"))
      );
      if (hasSavedContext && !fromRegister) {
        router.push("/negocios?seccion=diagnostico");
        return;
      }
    } catch {}
    router.push("/negocios/nuevo");
  }

  function quickSignIn(account: LocalAccount) {
    activateDemoAccount(account.email);
    redirectAfterAuth(false);
  }

  async function handleGoogleSignIn() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setMessage(
        "Firebase no está configurado aún. Puedes usar el modo local o cuentas guardadas."
      );
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const provider = getGoogleProvider();
      const res = await signInWithPopup(auth, provider);
      const email = res.user.email || "usuario@google.com";
      const name =
        res.user.displayName || email.split("@")[0] || "Propietario";
      activateAccount(email, name);
      redirectAfterAuth(false);
    } catch (err) {
      const error = err as AuthError;
      const msg = getErrorMessage(error);
      if (msg) setMessage(msg);
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const name =
      String(data.get("name") || "").trim() ||
      email.split("@")[0] ||
      "Propietario";
    const auth = getFirebaseAuth();

    if (!auth) {
      if (isRegister) {
        const created = saveDemoAccount(email, name);
        if (!created) {
          activateDemoAccount(email);
          redirectAfterAuth(false);
          return;
        }
      } else {
        const activated = activateDemoAccount(email);
        if (!activated) {
          setMessage(
            "No encontramos una cuenta con ese correo. Cambia a la pestaña «Crear cuenta» para registrarte."
          );
          setLoading(false);
          return;
        }
      }
      redirectAfterAuth(isRegister);
      return;
    }

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (name && userCred.user) {
          await updateProfile(userCred.user, { displayName: name });
        }
        activateAccount(email, name);
      } else {
        const userCred = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const displayName = userCred.user.displayName || name;
        activateAccount(email, displayName);
      }
      redirectAfterAuth(isRegister);
    } catch (err) {
      const error = err as AuthError;
      setMessage(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[440px]">
          {requiresSessionNotice && (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-center text-xs font-bold text-blue-800">
              🔒 Inicia sesión o crea tu cuenta gratuita para registrar la ficha
              tributaria de tu restaurante.
            </div>
          )}

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] sm:p-8">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("login");
                  setMessage("");
                }}
                className={
                  "rounded-xl py-2.5 transition " +
                  (!isRegister
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900")
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
                  (isRegister
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900")
                }
              >
                Crear cuenta
              </button>
            </div>

            <div className="mt-6 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl">
                {isRegister ? "🍽️" : "👋"}
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                {isRegister ? "Crea tu cuenta" : "Bienvenido a Crea"}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {isRegister
                  ? "Regístrate para evaluar y organizar las obligaciones tributarias de tu restaurante en Cajamarca."
                  : "Ingresa para consultar el diagnóstico, simulador y cronograma SUNAT de tu restaurante."}
              </p>
            </div>

            {/* Google Sign In Button */}
            {firebaseActive && (
              <div className="mt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative bg-white px-2 text-[10px] uppercase tracking-wider text-slate-400">
                    O con correo electrónico
                  </span>
                </div>
              </div>
            )}

            {/* Saved accounts 1-click access when in login mode */}
            {!isRegister && savedAccounts.length > 0 && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Cuentas guardadas en este navegador
                </p>
                <div className="mt-2 space-y-1.5">
                  {savedAccounts.slice(0, 3).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => quickSignIn(acc)}
                      className="flex w-full items-center justify-between rounded-xl border border-white bg-white px-3 py-2 text-left text-xs shadow-2xs transition hover:border-blue-300"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase">
                          {acc.name.slice(0, 1)}
                        </span>
                        <span className="truncate font-bold text-slate-800">
                          {acc.name}
                        </span>
                        <span className="truncate text-slate-400">
                          ({acc.email})
                        </span>
                      </span>
                      <span className="shrink-0 font-bold text-blue-600">
                        Entrar →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              {isRegister && (
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del propietario o administrador
                  <input
                    required
                    name="name"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                    placeholder="Ej. María Rojas"
                  />
                </label>
              )}

              <label className="block text-xs font-bold text-slate-700">
                Correo electrónico
                <input
                  required
                  name="email"
                  type="email"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  placeholder="nombre@correo.com"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Contraseña
                <input
                  required
                  name="password"
                  minLength={6}
                  type="password"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

              {message && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
                >
                  {message}
                </p>
              )}

              <button
                disabled={loading}
                className="mt-2 h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading
                  ? "Cargando…"
                  : isRegister
                    ? "Crear cuenta e ir a «Mi restaurante» →"
                    : "Iniciar sesión →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
