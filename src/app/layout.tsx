import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Crea · Ruta de Formalización y Régimen Tributario",
  description: "Plataforma interactiva de recomendación de régimen tributario y ruta de formalización empresarial en Perú.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="antialiased selection:bg-blue-600 selection:text-white">{children}</body>
    </html>
  );
}
