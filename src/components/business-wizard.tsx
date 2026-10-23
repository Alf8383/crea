"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";
import { districtsFor, locations, provincesFor } from "@/lib/locations";
import { getTaxPath } from "@/lib/practical-guides";
import { sectionNames, visibleQuestions, type Answers, type Question } from "@/lib/questionnaire";
import { RuleEngine } from "@/lib/rule-engine";
import { activities, rules, sources } from "@/lib/seed-catalog";
import type { BusinessContext } from "@/lib/types";

const draftKey = "efp-questionnaire-draft";

const sectorMap: Record<string, string> = {
  "Restaurante / alimentos": "alimentos",
  "Tienda / comercio": "comercio",
  Tecnología: "tecnologia",
  Servicios: "profesional",
  Construcción: "construccion",
  Transporte: "transporte",
  Manufactura: "manufactura",
  Turismo: "turismo",
  Hospedaje: "alojamiento",
  Educación: "educacion",
  Salud: "salud",
  Belleza: "belleza",
  Agropecuario: "agricultura",
  Importación: "importacion",
  Exportación: "exportacion",
  Entretenimiento: "entretenimiento",
  Otro: "otro",
};

const amountRanges = [
  "Menos de S/ 2,500",
  "S/ 2,500 a S/ 5,000",
  "S/ 5,001 a S/ 10,000",
  "S/ 10,001 a S/ 20,000",
  "S/ 20,001 a S/ 50,000",
  "S/ 50,001 a S/ 100,000",
  "Más de S/ 100,000",
  "Todavía no puedo estimarlo",
];

const activityExamples: Record<string, string[]> = {
  alimentos: ["Restaurante", "Cafetería", "Comida para llevar", "Pastelería", "Servicio de catering"],
  comercio: ["Tienda de ropa", "Bodega o minimarket", "Venta de abarrotes", "Ferretería", "Venta por Internet"],
  tecnologia: ["Desarrollo de software", "Diseño de páginas web", "Aplicaciones móviles", "Soporte técnico", "Consultoría TI"],
  profesional: ["Consultoría empresarial", "Diseño gráfico", "Servicios contables", "Asesoría legal", "Servicios técnicos"],
  construccion: ["Construcción de viviendas", "Remodelación", "Instalaciones eléctricas", "Acabados", "Contratista general"],
  transporte: ["Transporte de carga", "Transporte de pasajeros", "Servicio de taxi", "Mensajería y reparto", "Transporte turístico"],
  manufactura: ["Fabricación de muebles", "Confección textil", "Elaboración de lácteos", "Panadería industrial", "Artesanía"],
  turismo: [
    "Vendo o reservo pasajes, hoteles y paquetes de otros proveedores",
    "Organizo y opero mis propios tours o excursiones",
    "Ofrezco ambos: agencia de viajes y tours propios",
    "Guía de turismo",
  ],
  alojamiento: ["Hospedaje", "Hotel", "Hostal", "Alquiler de habitaciones", "Alojamiento turístico"],
  educacion: ["Centro de capacitación", "Clases particulares", "Academia de idiomas", "Talleres educativos", "Tutoría"],
  salud: ["Consultorio médico", "Atención de enfermería", "Rehabilitación física", "Consultorio odontológico", "Laboratorio"],
  belleza: ["Salón de belleza", "Peluquería", "Manicure y pedicure", "Barbería", "Spa y estética"],
  agricultura: ["Cultivo de hortalizas", "Cultivo de frutas", "Producción lechera", "Crianza de animales", "Venta agrícola"],
  importacion: ["Importación de ropa", "Importación de equipos", "Importación de repuestos", "Importación para venta"],
  exportacion: ["Exportación agrícola", "Exportación de artesanías", "Exportación de café o cacao", "Venta al exterior"],
  entretenimiento: ["Organización de eventos", "Producción musical", "Espectáculos en vivo", "Juegos recreativos", "Audiovisual"],
};

const answer = (data: Answers, id: string) => String(data[id] || "");
const number = (data: Answers, id: string) => Number(answer(data, id)) || 0;
const yes = (data: Answers, id: string) => answer(data, id) === "Sí";
const selectedStyle = "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/15";

function toContext(a: Answers): BusinessContext {
  const sectorId = sectorMap[answer(a, "P01")] || "otro";
  const description = answer(a, "P02") || answer(a, "P01.1");
  const normalizeActivity = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  const normalizedDescription = normalizeActivity(description);
  const tourismAgency = sectorId === "turismo" && /\b(agencia|reserv|pasaj|boleto|tercer|proveedor)\b/.test(normalizedDescription);
  const tourismOperator =
    sectorId === "turismo" && /oper|organiz|realiz|ofrezco|hago|propio|excursion|tour/.test(normalizedDescription) && !tourismAgency;

  const matched = !normalizedDescription
    ? undefined
    : tourismAgency
    ? activities.find((item) => item.id === "agencia")
    : tourismOperator
    ? activities.find((item) => item.id === "operador-turistico")
    : activities.find(
        (item) =>
          item.sectorId === sectorId &&
          (normalizeActivity(item.name).includes(normalizedDescription) || normalizedDescription.includes(normalizeActivity(item.name))),
      ) || (sectorId !== "otro" ? activities.find((item) => item.sectorId === sectorId) : undefined);

  const invoice = answer(a, "P23");
  const customerAnswer = answer(a, "P22");

  return {
    questionnaire: a,
    businessName: description || answer(a, "P01.1") || "Mi negocio",
    purpose: answer(a, "P03").includes("formalizad")
      ? "revisar"
      : answer(a, "P03").includes("ventas") || answer(a, "P03").includes("opero")
      ? "formalizar"
      : "crear",
    sectorId,
    activityId: matched?.id || "",
    otherActivity: description,
    department: answer(a, "P04"),
    province: answer(a, "P05") === "No encuentro mi provincia" ? answer(a, "P05_TEXT") : answer(a, "P05"),
    district: answer(a, "P06") === "No encuentro mi distrito" ? answer(a, "P06_TEXT") : answer(a, "P06"),
    legalPerson:
      answer(a, "P09") === "Persona natural"
        ? "natural"
        : answer(a, "P09") === "Persona jurídica / empresa"
        ? "juridica"
        : "aun-no-se",
    hasPartners: ["2 personas", "3 personas", "4 o más"].includes(answer(a, "P07")),
    partnerCount: answer(a, "P07") === "2 personas" ? 2 : answer(a, "P07") === "3 personas" ? 3 : answer(a, "P07") === "4 o más" ? 4 : 1,
    hasPhysicalLocation: yes(a, "P10"),
    servesPublic: yes(a, "P12") || answer(a, "P12") === "Algunas veces",
    hasEmployees: yes(a, "P28"),
    employeeCount: number(a, "P29"),
    employeeCountPerShift: number(a, "P29.1"),
    sellsOnline: yes(a, "P25"),
    preparesFood: yes(a, "R01") || yes(a, "M07") || yes(a, "H03") || yes(a, "EN03"),
    importsGoods: sectorId === "importacion" || yes(a, "C03"),
    exportsGoods: sectorId === "exportacion" || yes(a, "P27") || yes(a, "A06"),
    providesRegulatedService: false,
    customerType:
      customerAnswer === "Personas"
        ? "personas"
        : customerAnswer === "Empresas" || customerAnswer === "Estado"
        ? "empresas"
        : customerAnswer === "Personas y empresas" || customerAnswer === "Personas, empresas y Estado"
        ? "ambos"
        : "aun-no-se",
    monthlyRevenue: answer(a, "P20").startsWith("monto:") ? Number(answer(a, "P20").slice(6)) || 0 : 0,
    monthlyPurchases: number(a, "TAX_PURCHASES"),
    annualPurchases: number(a, "TAX_PURCHASES") * 12,
    fixedAssets: number(a, "TAX_ASSETS"),
    needsInvoices:
      invoice.startsWith("Sí") || invoice === "Probablemente muy pocas veces"
        ? true
        : invoice.startsWith("No, venderé")
        ? false
        : null,
    hasMultipleLocations: false,
    foreignSourceIncome: false,
    collectsPersonalData: yes(a, "TE02"),
  };
}

function QuestionInput({
  question,
  data,
  setValue,
}: {
  question: Question;
  data: Answers;
  setValue: (id: string, value: string | string[]) => void;
}) {
  const value = data[question.id];
  const [categorySearch, setCategorySearch] = useState("");
  const [salesMode, setSalesMode] = useState<"direct" | "calculator">("direct");
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  if (question.id === "P01") {
    const iconByRubric: Record<string, string> = {
      "Restaurante / alimentos": "RESTAURANTE.png",
      "Tienda / comercio": "TIENDA.png",
      Tecnología: "TECNOLOGIA.png",
      Servicios: "SERVICIOS.png",
      Construcción: "CONSTRUCCION.png",
      Transporte: "TRANSPORTE.png",
      Manufactura: "MANUFACTURA.png",
      Turismo: "TURISMO.png",
      Hospedaje: "HOSPEDAJE.png",
      Educación: "EDUCACION.png",
      Salud: "SALUD.png",
      Belleza: "BELLEZA.png",
      Agropecuario: "AGROPECUARIO.png",
      Importación: "IMPORTACION.png",
      Exportación: "EXPORTACION.png",
      Entretenimiento: "entretenimiento.png",
    };
    const normalize = (text: string) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es");
    const rubrics = (question.options || []).filter(
      (item) => item.value !== "Otro" && normalize(item.label).includes(normalize(categorySearch)),
    );
    const selectedOther = value === "Otro";

    return (
      <div className="space-y-4">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-slate-400 focus-within:border-blue-600 focus-within:bg-white">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="2">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path strokeLinecap="round" d="m16 16 5 5" />
          </svg>
          <span className="sr-only">Buscar rubro</span>
          <input
            type="search"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Filtrar rubro (ej. restaurante, tienda, tecnología)..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {rubrics.map((item, index) => {
            const on = value === item.value;
            const id = "rubric-" + index;
            return (
              <div key={item.value} className="relative">
                <input
                  id={id}
                  className="peer sr-only"
                  type="radio"
                  name={question.id}
                  checked={on}
                  onChange={() => setValue(question.id, item.value)}
                />
                <label
                  htmlFor={id}
                  className={
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition hover:border-blue-400 " +
                    (on ? selectedStyle : "border-slate-200 bg-white")
                  }
                >
                  <Image
                    src={"/rubros/" + iconByRubric[item.value]}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                  <span className="text-xs font-bold leading-4 text-slate-800">{item.label}</span>
                  {on && (
                    <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </label>
              </div>
            );
          })}

          <div className="relative">
            <input
              id="rubric-other"
              className="peer sr-only"
              type="radio"
              name={question.id}
              checked={selectedOther}
              onChange={() => setValue(question.id, "Otro")}
            />
            <label
              htmlFor="rubric-other"
              className={
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition hover:border-blue-400 " +
                (selectedOther ? selectedStyle : "border-slate-200 bg-white")
              }
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-blue-600">
                +
              </span>
              <span className="text-xs font-bold text-slate-800">Otro rubro</span>
            </label>
          </div>
        </div>

        {selectedOther && (
          <input
            autoFocus
            type="text"
            value={answer(data, "P01.1")}
            onChange={(event) => setValue("P01.1", event.target.value)}
            placeholder="Especifica el rubro de tu negocio..."
            className={inputClass}
          />
        )}
      </div>
    );
  }

  if (question.id === "P02") {
    const sectorId = sectorMap[answer(data, "P01")] || "otro";
    const query = typeof value === "string" ? value : "";
    const examples = sectorId === "otro" ? [] : activityExamples[sectorId] || [];

    return (
      <div className="space-y-4">
        <div className="relative">
          <input
            id="main-activity-description"
            autoFocus
            type="text"
            value={query}
            onChange={(event) => setValue(question.id, event.target.value)}
            placeholder="Ej. Cafetería y pastelería, Bodega de abarrotes, Desarrollo de software..."
            className={inputClass + " pr-10"}
          />
          {query && (
            <button
              type="button"
              aria-label="Borrar descripción"
              onClick={() => setValue(question.id, "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        {examples.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sugerencias rápidas para elegir en 1 clic:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => setValue(question.id, example)}
                  className={
                    "rounded-xl border px-3.5 py-2 text-xs font-bold transition " +
                    (query === example
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50")
                  }
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (question.id === "P04") {
    const department = answer(data, "P04");
    const province = answer(data, "P05");
    const district = answer(data, "P06");
    const departments = [...new Set(locations.map((item) => item.department))];
    const provinces = provincesFor(department);
    const districts = districtsFor(department, province);

    const selectField = (
      label: string,
      list: string[],
      current: string,
      onChange: (value: string) => void,
      disabled = false,
      extra?: ReactNode,
    ) => (
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
        <select
          value={current}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={inputClass + " text-sm disabled:bg-slate-100 disabled:text-slate-400"}
        >
          <option value="">Selecciona {label.toLowerCase()}</option>
          {list.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          {extra}
        </select>
      </label>
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Selección rápida:</span>
          {[
            ["Cajamarca", "Cajamarca", "Cajamarca"],
            ["Cajamarca", "Cajamarca", "Los Baños del Inca"],
            ["Cajamarca", "Jaén", "Jaén"],
            ["Cajamarca", "Chota", "Chota"],
          ].map(([dep, prov, dist]) => (
            <button
              key={dist}
              type="button"
              onClick={() => {
                setValue("P04", dep);
                setTimeout(() => {
                  setValue("P05", prov);
                  setValue("P06", dist);
                }, 0);
              }}
              className="rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
            >
              📍 {dist}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {selectField("Departamento", departments, department, (val) => setValue("P04", val))}
          {selectField(
            "Provincia",
            provinces,
            province,
            (val) => setValue("P05", val),
            !department,
            <option value="No encuentro mi provincia">Otra provincia</option>,
          )}
          {selectField(
            "Distrito",
            districts,
            district,
            (val) => setValue("P06", val),
            !province,
            <option value="No encuentro mi distrito">Otro distrito</option>,
          )}
        </div>

        {province === "No encuentro mi provincia" && (
          <input
            className={inputClass}
            value={answer(data, "P05_TEXT")}
            onChange={(event) => setValue("P05_TEXT", event.target.value)}
            placeholder="Escribe el nombre de tu provincia"
          />
        )}
        {district === "No encuentro mi distrito" && (
          <input
            className={inputClass}
            value={answer(data, "P06_TEXT")}
            onChange={(event) => setValue("P06_TEXT", event.target.value)}
            placeholder="Escribe el nombre de tu distrito"
          />
        )}
      </div>
    );
  }

  if (question.kind === "text" || question.kind === "number") {
    const isTaxAmount = question.id === "TAX_PURCHASES" || question.id === "TAX_ASSETS";
    const presets =
      question.id === "TAX_PURCHASES"
        ? [
            ["0", "S/ 0 (Sin compras)"],
            ["800", "S/ 800"],
            ["1800", "S/ 1,800"],
            ["4500", "S/ 4,500"],
            ["10500", "S/ 10,500"],
          ]
        : question.id === "TAX_ASSETS"
        ? [
            ["0", "S/ 0 (Sin equipos)"],
            ["2500", "S/ 2,500"],
            ["8500", "S/ 8,500"],
            ["22000", "S/ 22,000"],
            ["80000", "S/ 80,000"],
          ]
        : [];

    return (
      <div className="space-y-3">
        <div className="relative">
          {isTaxAmount && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
              S/
            </span>
          )}
          <input
            autoFocus
            type={question.kind === "number" ? "number" : "text"}
            min={question.kind === "number" ? 0 : undefined}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setValue(question.id, event.target.value)}
            placeholder={isTaxAmount ? "0" : question.kind === "number" ? "Cantidad" : "Escribe tu respuesta"}
            className={inputClass + (isTaxAmount ? " pl-10 font-bold" : "")}
          />
        </div>
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {presets.map(([amount, label]) => (
              <button
                type="button"
                key={amount}
                onClick={() => setValue(question.id, amount)}
                className={
                  "rounded-xl border px-3.5 py-2 text-xs font-bold transition " +
                  (value === amount
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300")
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (question.kind === "range") {
    type EstimateLine = { id: string; name: string; quantity: string; price: string };
    const savedLines = (() => {
      try {
        const saved = JSON.parse(answer(data, "P20_EST_ITEMS")) as EstimateLine[];
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    })();
    const estimateLines: EstimateLine[] = savedLines.length
      ? savedLines
      : [{ id: "item-1", name: "", quantity: "", price: "" }];
    const updateLines = (lines: EstimateLine[]) => setValue("P20_EST_ITEMS", JSON.stringify(lines));
    const projectedAmount =
      Math.round(estimateLines.reduce((total, line) => total + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0) * 100) /
      100;
    const currentAmount = typeof value === "string" && value.startsWith("monto:") ? value.slice(6) : "";

    return (
      <div className="space-y-4">
        {/* Clean 2-Tab Switcher for Sales Input */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSalesMode("direct")}
            className={
              "rounded-lg px-3.5 py-2 transition " +
              (salesMode === "direct" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
            }
          >
            Monto rápido o rango
          </button>
          <button
            type="button"
            onClick={() => setSalesMode("calculator")}
            className={
              "rounded-lg px-3.5 py-2 transition " +
              (salesMode === "calculator" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
            }
          >
            Calculadora por producto / servicio
          </button>
        </div>

        {salesMode === "direct" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <label className="block text-xs font-bold text-slate-700">
                Monto mensual estimado de ventas (S/)
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    className={inputClass + " pl-10 font-bold"}
                    value={currentAmount}
                    onChange={(event) => setValue(question.id, event.target.value ? "monto:" + event.target.value : "")}
                    placeholder="Ej. 4200"
                  />
                </div>
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["2500", "S/ 2,500 (NRUS Cat. 1)"],
                  ["4200", "S/ 4,200 (NRUS Cat. 1)"],
                  ["7000", "S/ 7,000 (NRUS Cat. 2)"],
                  ["16500", "S/ 16,500 (RER / RMT)"],
                  ["28000", "S/ 28,000 (RMT)"],
                ].map(([amt, label]) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setValue(question.id, "monto:" + amt)}
                    className={
                      "rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                      (currentAmount === amt
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                O selecciona un rango referencial:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {amountRanges.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setValue(question.id, item)}
                    className={
                      "rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition " +
                      (value === item ? selectedStyle : "border-slate-200 bg-white text-slate-700 hover:border-blue-300")
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <p className="text-xs text-slate-600">
              Agrega tus productos o servicios principales para estimar tus ingresos mensuales:
            </p>
            {estimateLines.map((line, index) => (
              <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_110px_120px_auto] sm:items-end">
                <label className="block text-xs font-bold text-slate-700">
                  Producto / Servicio {index + 1}
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) =>
                      updateLines(estimateLines.map((item) => (item.id === line.id ? { ...item, name: e.target.value } : item)))
                    }
                    placeholder="Ej. Menú, corte, consulta"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Cant. / mes
                  <input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLines(estimateLines.map((item) => (item.id === line.id ? { ...item, quantity: e.target.value } : item)))
                    }
                    placeholder="Ej. 80"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Precio (S/)
                  <input
                    type="number"
                    min={0}
                    value={line.price}
                    onChange={(e) =>
                      updateLines(estimateLines.map((item) => (item.id === line.id ? { ...item, price: e.target.value } : item)))
                    }
                    placeholder="Ej. 25"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal"
                  />
                </label>
                {estimateLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => updateLines(estimateLines.filter((item) => item.id !== line.id))}
                    className="rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  updateLines([...estimateLines, { id: `item-${Date.now()}`, name: "", quantity: "", price: "" }])
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50"
              >
                + Añadir fila
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  Total calculado: <b className="text-sm text-blue-600">S/ {projectedAmount}</b>
                </span>
                <button
                  type="button"
                  disabled={projectedAmount <= 0}
                  onClick={() => {
                    setValue(question.id, "monto:" + projectedAmount);
                    setSalesMode("direct");
                  }}
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  Aplicar monto →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const multiple = question.kind === "multiple";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {question.options?.map((item, index) => {
        const on = multiple ? Array.isArray(value) && value.includes(item.value) : value === item.value;
        return (
          <label
            key={item.value}
            className={
              "relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition hover:border-blue-400 " +
              (on ? selectedStyle : "border-slate-200 bg-white")
            }
          >
            <input
              className="sr-only"
              type={multiple ? "checkbox" : "radio"}
              name={question.id}
              checked={Boolean(on)}
              onChange={() => {
                if (multiple) {
                  const current = Array.isArray(value) ? value : [];
                  setValue(question.id, on ? current.filter((v) => v !== item.value) : [...current, item.value]);
                } else setValue(question.id, item.value);
              }}
            />
            <span
              className={
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold " +
                (on ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")
              }
            >
              {on ? "✓" : index + 1}
            </span>
            <span className="text-sm font-bold leading-snug text-slate-800">{item.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function BusinessWizard() {
  const router = useRouter();
  const [data, setData] = useState<Answers>({});
  const [section, setSection] = useState(0);
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const accountDraftKey = scopedStorageKey(draftKey);
  const accountContextKey = scopedStorageKey("efp-business-context");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(accountDraftKey);
        const draft = saved ? JSON.parse(saved) : {};
        const answers: Answers = draft.answers || {};
        const requestedQuestion = new URLSearchParams(window.location.search).get("continuar");
        let restoredSection = Math.min(4, draft.section || 0);
        let restoredPosition = draft.position || 0;
        if (requestedQuestion === "tributario") {
          restoredSection = 2;
          restoredPosition = 0;
        } else if (requestedQuestion) {
          for (let index = 0; index < 5; index++) {
            const targetPosition = visibleQuestions(index, answers).findIndex((question) => question.id === requestedQuestion);
            if (targetPosition >= 0) {
              restoredSection = index;
              restoredPosition = targetPosition;
              break;
            }
          }
        }
        setData(answers);
        setSection(restoredSection);
        setPosition(Math.max(0, Math.min(restoredPosition, visibleQuestions(restoredSection, answers).length - 1)));
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [accountDraftKey]);

  const current = useMemo(() => visibleQuestions(section, data), [section, data]);
  const q = current[Math.min(position, Math.max(0, current.length - 1))];
  const value = q ? data[q.id] : undefined;

  const canContinue =
    section === 4 ||
    !q ||
    ((q.optional || (Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim()))) &&
      !(q.id === "P01" && value === "Otro" && !answer(data, "P01.1").trim()) &&
      !(
        q.id === "P04" &&
        (!answer(data, "P05") ||
          !answer(data, "P06") ||
          (answer(data, "P05") === "No encuentro mi provincia" && !answer(data, "P05_TEXT").trim()) ||
          (answer(data, "P06") === "No encuentro mi distrito" && !answer(data, "P06_TEXT").trim()))
      ));

  const setValue = (id: string, val: string | string[]) =>
    setData((previous) => {
      const next = { ...previous, [id]: val };
      if (id === "P04") {
        next.P05 = "";
        next.P05_TEXT = "";
        next.P06 = "";
        next.P06_TEXT = "";
      }
      if (id === "P05") {
        next.P06 = "";
        next.P06_TEXT = "";
        if (val !== "No encuentro mi provincia") next.P05_TEXT = "";
      }
      if (id === "P06" && val !== "No encuentro mi distrito") next.P06_TEXT = "";
      localStorage.setItem(accountDraftKey, JSON.stringify({ answers: next, section, position }));
      return next;
    });

  const move = (direction: 1 | -1) => {
    if (direction === 1) {
      if (position < current.length - 1) setPosition(position + 1);
      else {
        setSection(Math.min(4, section + 1));
        setPosition(0);
      }
    } else if (position > 0) setPosition(position - 1);
    else if (section > 0) {
      const before = visibleQuestions(section - 1, data);
      setSection(section - 1);
      setPosition(Math.max(0, before.length - 1));
    }
    const nextSection =
      direction === 1 && position >= current.length - 1
        ? Math.min(4, section + 1)
        : direction === -1 && position === 0
        ? Math.max(0, section - 1)
        : section;
    localStorage.setItem(
      accountDraftKey,
      JSON.stringify({
        answers: data,
        section: nextSection,
        position:
          direction === 1 && position >= current.length - 1
            ? 0
            : direction === -1 && position === 0
            ? Math.max(0, visibleQuestions(nextSection, data).length - 1)
            : position + direction,
      }),
    );
  };

  const jumpToQuestion = (questionId: string) => {
    for (let s = 0; s < 4; s++) {
      const idx = visibleQuestions(s, data).findIndex((item) => item.id === questionId);
      if (idx >= 0) {
        setSection(s);
        setPosition(idx);
        localStorage.setItem(accountDraftKey, JSON.stringify({ answers: data, section: s, position: idx }));
        return;
      }
    }
  };

  const fillPresetIntoWizard = (preset: DemoPreset) => {
    const qAnswers = (preset.context.questionnaire || {}) as Answers;
    setData(qAnswers);
    setSection(4);
    setPosition(0);
    try {
      localStorage.setItem(accountDraftKey, JSON.stringify({ answers: qAnswers, section: 4, position: 0 }));
      localStorage.setItem(accountContextKey, JSON.stringify(preset.context));
    } catch {}
  };

  const resetWizard = () => {
    setData({});
    setSection(0);
    setPosition(0);
    try {
      localStorage.removeItem(accountDraftKey);
    } catch {}
  };

  const finish = async () => {
    setBusy(true);
    const context = toContext(data);
    localStorage.setItem(accountContextKey, JSON.stringify(context));
    let targetPath = "/negocios/demo/ruta";
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.id) targetPath = `/negocios/${body.id}/ruta`;
      }
    } catch {
    } finally {
      setBusy(false);
      router.push(targetPath);
    }
  };

  const previewContext = useMemo(() => toContext(data), [data]);
  const previewSteps = useMemo(() => RuleEngine.evaluate(previewContext, rules, sources), [previewContext]);
  const previewTax = useMemo(() => getTaxPath(previewContext), [previewContext]);

  const summary: [string, string, string][] = [
    ["Actividad", answer(data, "P02") || answer(data, "P01.1") || "Sin definir", "P02"],
    ["Rubro", answer(data, "P01"), "P01"],
    [
      "Ubicación",
      [
        answer(data, "P06") === "No encuentro mi distrito" ? answer(data, "P06_TEXT") : answer(data, "P06"),
        answer(data, "P05") === "No encuentro mi provincia" ? answer(data, "P05_TEXT") : answer(data, "P05"),
        answer(data, "P04"),
      ]
        .filter(Boolean)
        .join(", "),
      "P04",
    ],
    ["Etapa", answer(data, "P03"), "P03"],
    ["Propietarios y forma", [answer(data, "P07"), answer(data, "P09")].filter(Boolean).join(" · "), "P07"],
    ["Local físico", answer(data, "P10") === "Sí" ? answer(data, "P11") || "Sí" : "No", "P10"],
    [
      "Ventas mensuales",
      answer(data, "P20").startsWith("monto:") ? "S/ " + answer(data, "P20").slice(6) : answer(data, "P20"),
      "P20",
    ],
    [
      "Compras y activos",
      [
        answer(data, "TAX_PURCHASES") ? `Compras: S/ ${answer(data, "TAX_PURCHASES")}` : "",
        answer(data, "TAX_ASSETS") ? `Equipos: S/ ${answer(data, "TAX_ASSETS")}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      "TAX_PURCHASES",
    ],
    ["Clientes y facturas", [answer(data, "P22"), answer(data, "P23")].filter(Boolean).join(" · "), "P22"],
    [
      "Trabajadores",
      answer(data, "P28") === "Sí" ? `${answer(data, "P29") || 0} total (${answer(data, "P29.1") || 0} por turno)` : answer(data, "P28"),
      "P28",
    ],
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {/* Quick Preset Autocomplete Bar + Stepper */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Autocompletar con ejemplo:</span>
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => fillPresetIntoWizard(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {preset.shortTitle} ({preset.targetRegime})
                </button>
              ))}
            </div>
            {Object.keys(data).length > 0 && (
              <button
                type="button"
                onClick={resetWizard}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Reiniciar respuestas
              </button>
            )}
          </div>

          {/* 5-Section Clickable Stepper */}
          <ol aria-label="Progreso del cuestionario" className="mt-5 grid grid-cols-5 gap-2">
            {sectionNames.map((name, index) => {
              const active = index === section;
              const done = index < section;
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => {
                      if (index <= section || Object.keys(data).length > 0) {
                        setSection(index);
                        setPosition(0);
                      }
                    }}
                    className={
                      "flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center transition " +
                      (active ? "bg-blue-50/80 text-blue-600" : "text-slate-500 hover:bg-slate-50")
                    }
                  >
                    <span
                      className={
                        "grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold " +
                        (done
                          ? "bg-emerald-500 text-white"
                          : active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500")
                      }
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span className="hidden text-xs font-bold sm:block">{name}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {section < 4 ? (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>
                  Sección {section + 1} de 5 · Pregunta {position + 1} de {current.length}
                </span>
                <span>{Math.round(((position + 1) / current.length) * 100)}% de la sección</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: ((position + 1) / current.length) * 100 + "%" }}
                />
              </div>

              <div className="mt-6">
                <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">{q?.title}</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  {q?.help || "Selecciona la opción que mejor describa tu escenario actual."}
                </p>
              </div>

              <div className="mt-6">{q && <QuestionInput key={q.id} question={q} data={data} setValue={setValue} />}</div>

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  disabled={section === 0 && position === 0}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-2">
                  {Object.keys(data).length >= 5 && (
                    <button
                      type="button"
                      onClick={() => setSection(4)}
                      className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-blue-600"
                    >
                      Ir al resumen →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => move(1)}
                    disabled={!canContinue}
                    className="rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Paso 5 de 5 · Diagnóstico preliminar</span>
                  <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Resumen de tu evaluación</h1>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={finish}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Generando ruta…" : "Abrir mi ruta y simulador SUNAT →"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Preselección tributaria</span>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{previewTax.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{previewTax.reason}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Ruta de formalización</span>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {previewSteps.length} trámites y requisitos detectados
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Haz clic en cualquier dato de abajo si deseas corregirlo antes de abrir el panel completo.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {summary.map(([label, val, qId]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => jumpToQuestion(qId)}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-left transition hover:border-blue-400 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                      <span className="text-[11px] font-bold text-blue-600 opacity-70 group-hover:opacity-100">Editar ✎</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-800">{val || "Sin especificar"}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  ← Volver a preguntas
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={finish}
                  className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Preparando…" : "Ver mi ruta y simulador tributario →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
