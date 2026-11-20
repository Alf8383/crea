import type { Metadata } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/newsreader/wght.css";
import { SessionProvider } from "@/features/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AssistantProvider } from "@/features/assistant/cloud";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CREA · Orientación para negocios gastronómicos", template: "%s · CREA" },
  description: "Evalúa tu negocio gastronómico en Cajamarca, proyecta tus ventas y organiza tu formalización.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE" data-scroll-behavior="smooth">
      <body>
        <SessionProvider>
          <AssistantProvider>
            <SiteHeader />
            <main id="contenido" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </AssistantProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
