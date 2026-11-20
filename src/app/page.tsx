import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SourceLink } from "@/components/ui/primitives";
import { AssessmentEntry } from "@/features/evaluation/assessment-entry";
import { sourceById } from "@/lib/seed-catalog";
import styles from "./home.module.css";

const preparation = [
  { label: "Actividad y etapa", text: "Piensa qué ofrecerás y cómo atenderás. Si ya operas, puedes revisar tu situación actual." },
  { label: "Ventas y compras", text: "Usa cifras reales, calcula una proyección o indica que aún no tienes el dato." },
  { label: "Datos del negocio", text: "Identifica el lugar donde operarás, quiénes serán tus clientes y si necesitarás emitir facturas." },
];

export default function Home() {
  const sunat = sourceById("sunat-regimes");

  return <div className={styles.home}>
    <section className={"container-site " + styles.hero} aria-labelledby="landing-title">
      <div className={styles.intro}>
        <p className={styles.kicker}>Orientación tributaria para Cajamarca</p>
        <h1 id="landing-title">Formaliza tu negocio gastronómico</h1>
        <p className={styles.lead}>Desde la primera idea hasta un negocio en marcha. Estima tus ventas, conoce tus opciones tributarias y organiza tus trámites en Cajamarca.</p>

        <div className={styles.start}>
          <AssessmentEntry className={styles.primary} />
          <p>Puedes empezar sin cuenta ni Clave SOL.</p>
        </div>

        <nav className={styles.quickLinks} aria-label="Consultas directas">
          <Link href="/comparar">Comparar regímenes <ArrowRight aria-hidden="true" /></Link>
          <Link href="/obligaciones">Consultar obligaciones <ArrowRight aria-hidden="true" /></Link>
          <Link href="/negocios?seccion=simulador">Proyectar ventas <ArrowRight aria-hidden="true" /></Link>
          <Link href="/negocios?seccion=ejemplos">Probar con un ejemplo <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </div>

      <aside className={styles.example} aria-labelledby="landing-example">
        <div className={styles.sheet}>
          <h2 id="landing-example" className={styles.sheetTitle}>Ejemplo de diagnóstico</h2>
          <p className={styles.sheetLabel}>Régimen declarado</p>
          <p className={styles.regimeName}>Régimen Especial de Renta</p>
          <div className={styles.finding}>
            <p className={styles.status}>Por confirmar</p>
            <p>Falta el total anual de compras para verificar las condiciones de este régimen.</p>
          </div>
          <div className={styles.nextStep}>
            <p className={styles.sheetLabel}>Siguiente paso</p>
            <p>Completar compras del año</p>
          </div>
        </div>
      </aside>
    </section>

    <section className={"container-site " + styles.preparation} id="como-funciona" aria-labelledby="landing-preparation">
      <h2 id="landing-preparation">Qué tener a mano</h2>
      <dl>
        {preparation.map(({ label, text }) => <div key={label}>
          <dt>{label}</dt>
          <dd>{text}</dd>
        </div>)}
      </dl>
    </section>

    {sunat && <div className={"container-site " + styles.source}>
      <p>El diagnóstico enlaza cada regla evaluada con su fuente oficial.</p>
      <SourceLink href={sunat.url}>Guía de regímenes de SUNAT</SourceLink>
    </div>}
  </div>;
}
