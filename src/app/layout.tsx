import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crea",
  description: "Orientación trazable para crear y formalizar empresas en Perú.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
