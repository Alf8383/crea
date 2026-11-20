"use client";

import { Calculator } from "lucide-react";
import { ProjectionCalculator } from "./projection-calculator";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice, SourceLink } from "@/components/ui/primitives";
import { TextField } from "@/features/evaluation/assessment-fields";
import { soles } from "@/lib/utils";
import { RegimeStatus } from "@/features/evaluation/results";
import { IGV_RESTAURANT_SOURCE_URL } from "@/lib/tax-constants";
import { simulateRestaurantTaxes, type TaxSimulationResult } from "@/lib/tax-simulator";
import type { BusinessContext, TaxRecommendation } from "@/lib/types";

const fields = [
  ["grossMonthlySales", "Ventas del mes", "Ingresa el total cobrado, con IGV cuando corresponda."],
  ["grossMonthlyPurchasesWithInvoice", "Compras con factura", "Total pagado por compras con factura, incluido el IGV."],
  ["monthlyPurchasesWithoutInvoice", "Compras sin factura", "Incluye compras con boleta u otros comprobantes."],
  ["monthlyOperatingExpenses", "Otros gastos sustentados", "Por ejemplo, planilla o alquiler. Usa el importe sin IGV."],
  ["fiscalCreditFromInvoices", "Crédito fiscal de las facturas (opcional)", "Si conoces el IGV deducible del mes, indícalo aquí."],
] as const;

type SimField = typeof fields[number][0];

export function Simulation({ context, recommendations }: { context: BusinessContext; recommendations: TaxRecommendation[] }) {
  const [values, setValues] = useState<Partial<Record<SimField, string>>>(() => ({
    grossMonthlySales: context.monthlyRevenue?.toString(),
    grossMonthlyPurchasesWithInvoice: context.monthlyPurchasesWithInvoice?.toString(),
    monthlyPurchasesWithoutInvoice: context.monthlyPurchasesWithoutInvoice?.toString(),
    monthlyOperatingExpenses: context.monthlyOperatingExpenses?.toString(),
  }));
  const [reduced, setReduced] = useState(false);
  const [result, setResult] = useState<TaxSimulationResult | null>(null);
  const [failure, setFailure] = useState<Partial<Record<SimField, string>>>({});
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  function estimate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numbers: Partial<Record<SimField, number>> = {};
    const errors: typeof failure = {};
    for (const [key] of fields) {
      const value = values[key]?.trim() || "";
      if (!value && key === "fiscalCreditFromInvoices") continue;
      if (!/^\d{1,12}(?:[.,]\d{1,2})?$/.test(value)) {
        errors[key] = "Ingresa un importe válido. Usa 0 si no hubo movimientos.";
      } else {
        numbers[key] = Number(value.replace(",", "."));
      }
    }
    if (numbers.fiscalCreditFromInvoices !== undefined && numbers.grossMonthlyPurchasesWithInvoice !== undefined &&
      numbers.fiscalCreditFromInvoices > numbers.grossMonthlyPurchasesWithInvoice * 18 / 118 + 0.005) {
      errors.fiscalCreditFromInvoices = "El crédito no puede superar el IGV general incluido en las facturas.";
    }
    setFailure(errors);
    const first = Object.keys(errors)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setResult(simulateRestaurantTaxes(context, { ...numbers, useReducedRestaurantIgv: reduced }));
  }

  const input = ([id, label, hint]: typeof fields[number]) =>
    <TextField key={id} id={id} label={label} hint={hint} numeric maxLength={15}
      value={values[id] ?? ""} error={failure[id]} onChange={(value) => {
        setValues((previous) => ({ ...previous, [id]: value }));
        setResult(null);
        setFailure((previous) => ({ ...previous, [id]: undefined }));
      }} />;

  return <div className="grid gap-6">
    <ProjectionCalculator selectMonth onApply={(_projection, month) => {
      setValues((previous) => ({ ...previous, grossMonthlySales: month.toFixed(2) }));
      setFailure((previous) => ({ ...previous, grossMonthlySales: undefined }));
      setResult(null);
    }} />
    <Card className="p-5 sm:p-7">
      <h2 className="editorial-title">Datos de un mes</h2>
      <p className="mb-5 mt-2 text-muted-foreground">Usa un solo mes para todos los importes. Escribe 0 en los campos sin movimientos.</p>
      <form onSubmit={estimate} className="grid gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.slice(0, 4).map(input)}
        </div>
        <div className="grid gap-4 border-y border-border py-4">
          {input(fields[4])}
          <div>
            <label className="flex min-h-11 items-start gap-2 font-semibold">
              <input type="checkbox" checked={reduced} onChange={(event) => { setReduced(event.target.checked); setResult(null); }} aria-describedby="reduced-hint" />
              <span>Simular ventas con la tasa especial de 10,5 % (IGV e IPM)</span>
            </label>
            <p id="reduced-hint" className="text-sm text-muted-foreground">Úsala si verificaste que tu restaurante cumple los requisitos de SUNAT. Por defecto, el escenario usa 18 %.</p>
            <SourceLink href={IGV_RESTAURANT_SOURCE_URL}>Requisitos de la tasa especial</SourceLink>
          </div>
        </div>
        <Button type="submit" className="justify-self-start"><Calculator aria-hidden="true" /> Calcular estimación</Button>
      </form>
    </Card>
    {result && <section aria-labelledby="simulation-results" className="grid gap-3">
      <h2 id="simulation-results" ref={resultHeading} tabIndex={-1} className="editorial-title flow-anchor">Resultados del simulador</h2>
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">Ingresos cobrados</p><strong>{soles(result.inputsUsed.grossMonthlySales)}</strong></div>
        <div><p className="text-sm text-muted-foreground">Compras y otros gastos ingresados</p><strong>{soles(result.inputsUsed.grossMonthlyPurchasesWithInvoice + result.inputsUsed.monthlyPurchasesWithoutInvoice + result.inputsUsed.monthlyOperatingExpenses)}</strong></div>
        <div><p className="text-sm text-muted-foreground">Saldo estimado antes de impuestos</p><strong>{soles(result.inputsUsed.grossMonthlySales - result.inputsUsed.grossMonthlyPurchasesWithInvoice - result.inputsUsed.monthlyPurchasesWithoutInvoice - result.inputsUsed.monthlyOperatingExpenses)}</strong></div>
      </Card>
      <Notice>Escenario orientativo con IGV de ventas de {(result.igvRateApplied * 100).toLocaleString("es-PE", { maximumFractionDigits: 1 })} %. En RG y RMT por encima de 300 UIT se muestra el anticipo con 1,5 %. El coeficiente real puede elevarlo. Las cifras anuales de los detalles repiten el mes seleccionado doce veces.</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((rec) => {
          const sim = result.regimes[rec.code];
          return <Card key={rec.code} className="grid content-start gap-3 p-5">
            <h3 className="text-lg font-bold">{rec.title}</h3><RegimeStatus status={rec.status} />
            {rec.status === "INCOMPATIBLE" ? <p className="text-sm text-muted-foreground">Tu diagnóstico identifica una condición que impide aplicar este régimen.</p>
              : sim.canEstimate ? <>
                <p className="text-3xl font-bold tracking-tight">{soles(sim.totalMonthlyTaxEstimated)} <span className="text-sm font-normal text-muted-foreground">estimados en el mes</span></p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted-foreground">IGV del mes</dt><dd>{soles(sim.monthlyIgvPayable)}</dd></div>
                  <div><dt className="text-muted-foreground">{rec.code === "NRUS" ? "Cuota" : "Renta del mes"}</dt><dd>{soles(sim.monthlyIncomeTaxPayable)}</dd></div>
                </dl>
                <details className="rule-details border-t border-border">
                  <summary>Cómo se calculó</summary>
                  <ul className="list-disc space-y-2 pb-2 pl-5 text-sm text-muted-foreground">{sim.calculationExplanation.map((line) => <li key={line}>{line}</li>)}</ul>
                  <p className="text-sm text-muted-foreground">{sim.legalNote}</p>
                </details>
              </> : <p className="text-sm text-muted-foreground">{sim.insufficientDataReason}</p>}
          </Card>;
        })}
      </div>
      <details className="rule-details"><summary>Supuestos de la simulación</summary><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{result.assumptions.map((line) => <li key={line}>{line}</li>)}</ul></details>
    </section>}
  </div>;
}
