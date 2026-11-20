"use client";

import { Calculator, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/features/evaluation/assessment-fields";
import { projectSales, type SalesLine, type SalesProjection, type Season } from "@/lib/sales-projection";
import { soles } from "@/lib/utils";
import { IGV_GENERAL, IGV_RESTAURANTS_2026 } from "@/lib/tax-constants";
import { salesWithoutIgv } from "@/lib/tax-simulator";

const blank = { price: "", orders: "", days: "" };
const lineFields = [["price", "Precio promedio"], ["orders", "Pedidos diarios"], ["days", "Días al mes"]] as const;
const seasonFields = [["highMonths", "Meses de alta demanda"], ["highPercent", "Aumento (%)"], ["lowMonths", "Meses de baja demanda"], ["lowPercent", "Disminución (%)"]] as const;

export function ProjectionCalculator({ onApply, selectMonth, taxBreakdown }: {
  onApply?: (amounts: SalesProjection, selectedMonth: number, netAnnual?: number) => void;
  selectMonth?: boolean;
  taxBreakdown?: { required: boolean; reducedAvailable: boolean };
}) {
  const id = useId();
  const [lines, setLines] = useState([{ key: 0, ...blank }]);
  const [next, setNext] = useState(1);
  const [season, setSeason] = useState<Season>({ highMonths: "", highPercent: "", lowMonths: "", lowPercent: "" });
  const [requested, setRequested] = useState(false);
  const [applied, setApplied] = useState(false);
  const [month, setMonth] = useState<"regularMonth" | "maxMonth" | "lowMonth">("regularMonth");
  const [tax, setTax] = useState("");
  const result = requested ? projectSales(lines, season) : undefined;
  const rate = tax === "general" ? IGV_GENERAL : tax === "special" ? IGV_RESTAURANTS_2026 : tax === "none" ? 0 : undefined;

  function reset() { setRequested(false); setApplied(false); }
  function changeLine(key: number, field: keyof SalesLine, value: string) {
    setLines((previous) => previous.map((line) => line.key === key ? { ...line, [field]: value } : line));
    reset();
  }

  return <details className="projection-box rule-details rounded-xl border border-border bg-muted px-4 pb-2">
    <summary><Calculator size={18} className="mr-2 inline" aria-hidden="true" /> Proyectar ventas por productos o servicios</summary>
    <div className="grid gap-4 py-3">
      <p className="text-sm text-muted-foreground">Calcula ingresos cobrados antes de gastos. Agrega una fila por cada tipo de pedido para evitar contarlos dos veces.</p>
      {lines.map((line, index) => <fieldset key={line.key} className="rounded-lg border border-border bg-card p-3">
        <legend className="px-1 font-bold">Producto o servicio {index + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-3">{lineFields.map(([field, label]) =>
          <TextField key={field} id={id + line.key + field} label={label} value={line[field]} numeric whole={field !== "price"} maxLength={10} onChange={(value) => changeLine(line.key, field, value)} />)}</div>
        {lines.length > 1 && <Button type="button" variant="ghost" className="mt-2" onClick={() => {
          setLines((previous) => previous.filter(({ key }) => key !== line.key)); reset();
        }}><Trash2 aria-hidden="true" /> Quitar producto {index + 1}</Button>}
      </fieldset>)}
      <Button type="button" variant="outline" className="justify-self-start" disabled={lines.length === 12} onClick={() => {
        setLines((previous) => [...previous, { key: next, ...blank }]); setNext(next + 1); reset();
      }}><Plus aria-hidden="true" /> Agregar producto o servicio</Button>
      <details className="rule-details">
        <summary>Ajustar por temporadas</summary>
        <div className="grid gap-3 py-2 sm:grid-cols-2">{seasonFields.map(([field, label]) =>
          <TextField key={field} id={id + field} label={label} value={season[field]} numeric whole maxLength={4} onChange={(value) => {
            setSeason((previous) => ({ ...previous, [field]: value })); reset();
          }} />)}</div>
      </details>
      <Button type="button" className="justify-self-start" onClick={() => { setRequested(true); setApplied(false); }}>Calcular proyección</Button>
      {result?.error && <p role="alert" className="text-sm font-semibold text-destructive">{result.error}</p>}
      {result?.value && <>
        <dl className="grid gap-3 rounded-lg bg-card p-3 text-sm sm:grid-cols-3" aria-live="polite">
          {[
            ["Un mes regular", result.value.regularMonth],
            ["Mes de mayor venta", result.value.maxMonth],
            ["Total anual", result.value.annual],
          ].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd className="text-lg font-bold">{soles(Number(amount))}</dd></div>)}
        </dl>
        {onApply && <div className="grid justify-items-start gap-2">
          {selectMonth && <SelectField id={id + "month"} label="Mes para simular" value={month} onChange={(value) => {
            if (value === "regularMonth" || value === "maxMonth" || value === "lowMonth") {
              setMonth(value);
              setApplied(false);
            }
          }}>
            <option value="regularMonth">Mes regular</option>
            <option value="maxMonth">Mes de mayor venta</option>
            <option value="lowMonth">Mes de menor venta</option>
          </SelectField>}
          {taxBreakdown && <SelectField id={id + "tax"} label="IGV incluido en los precios"
            hint={taxBreakdown.required ? "Elige un supuesto para obtener las ventas netas del ejercicio." : "Puedes usar el total bruto y dejar las ventas netas pendientes."}
            value={tax} onChange={(value) => { setTax(value); setApplied(false); }}>
            <option value="">Todavía no lo sé</option>
            <option value="none">Los precios están expresados sin IGV</option>
            <option value="general">Incluyen IGV e IPM general (18 %)</option>
            {taxBreakdown.reducedAvailable && <option value="special">Incluyen IGV e IPM especial de restaurantes (10,5 % en 2026)</option>}
          </SelectField>}
          <Button type="button" variant="outline" disabled={taxBreakdown?.required && rate === undefined} onClick={() => {
            if (result.value) {
              onApply(result.value, result.value[month], rate === undefined ? undefined : salesWithoutIgv(result.value.annual, rate));
              setApplied(true);
            }
          }}>Usar proyección</Button>
          {applied && <p role="status" className="text-sm">Proyección aplicada.</p>}
        </div>}
      </>}
    </div>
  </details>;
}
