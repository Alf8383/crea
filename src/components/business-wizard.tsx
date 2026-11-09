"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { RuleEngine } from "@/lib/rule-engine";
import { seedCatalog } from "@/lib/seed-catalog";
import { DEMO_PRESETS } from "@/lib/demo-presets";
import { scopedStorageKey } from "@/lib/account-storage";
import { saveBusinessToFirestore } from "@/lib/firebase/businesses";
import type {
  BusinessContext,
  DataOrigin,
  ReceiptType,
  RestaurantActivityCode,
  TaxRegimeCode,
} from "@/lib/types";

const STEPS = [
  {
    num: 1,
    title: "Identificación y Régimen",
    sub: "RUC, contribuyente y actividad",
  },
  {
    num: 2,
    title: "Ventas, Compras y Comprobantes",
    sub: "Facturas, boletas y gastos",
  },
  {
    num: 3,
    title: "Locales, Personal y Activos",
    sub: "Condiciones operativas SUNAT",
  },
];

const STATUS_LABEL: Record<string, string> = {
  COMPATIBLE: "✓ Compatible",
  INCOMPATIBLE: "✕ Incompatible",
  INFORMACION_INSUFICIENTE: "Faltan datos",
};

export function BusinessWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Identificación tributaria
  const [ruc, setRuc] = useState("10428519302");
  const [businessName, setBusinessName] = useState(
    "Restaurante Tradicional El Cumbe"
  );
  const [district, setDistrict] = useState("Cajamarca");
  const [personType, setPersonType] = useState<
    "PERSONA_NATURAL" | "PERSONA_JURIDICA"
  >("PERSONA_NATURAL");
  const [currentRegime, setCurrentRegime] = useState<
    TaxRegimeCode | "SIN_REGIMEN"
  >("NRUS");
  const [restaurantSpecialty, setRestaurantSpecialty] =
    useState<RestaurantActivityCode>("RESTAURANTE_MENU");
  const [ciiu, setCiiu] = useState<"5610" | "5621">("5610");

  // Step 2: Ventas, compras y comprobantes
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>("4500");
  const [annualRevenue, setAnnualRevenue] = useState<string>("54000");
  const [monthlyPurchasesWithInvoice, setMonthlyPurchasesWithInvoice] =
    useState<string>("1500");
  const [monthlyPurchasesWithoutInvoice, setMonthlyPurchasesWithoutInvoice] =
    useState<string>("700");
  const [monthlyOperatingExpenses, setMonthlyOperatingExpenses] =
    useState<string>("900");
  const [needsFacturas, setNeedsFacturas] = useState<boolean>(false);
  const [emittedReceipts, setEmittedReceipts] = useState<ReceiptType[]>([
    "BOLETA",
  ]);

  // Step 3: Locales, trabajadores por turno, activos fijos y condiciones RMT
  const [establishmentCount, setEstablishmentCount] = useState<string>("1");
  const [employeesPerShift, setEmployeesPerShift] = useState<string>("2");
  const [fixedAssetsValue, setFixedAssetsValue] = useState<string>("12000");
  const [hasCorporateLinkageOverLimit, setHasCorporateLinkageOverLimit] =
    useState<boolean>(false);
  const [isForeignBranch, setIsForeignBranch] = useState<boolean>(false);

  // Origen de datos: Declarado por usuario vs Verificado en fuente oficial (SUNAT)
  const [dataOrigins, setDataOrigins] = useState<
    Record<string, DataOrigin>
  >({
    ruc: "VERIFICADO_FUENTE_OFICIAL",
    personType: "VERIFICADO_FUENTE_OFICIAL",
    currentRegime: "VERIFICADO_FUENTE_OFICIAL",
    ciiu: "VERIFICADO_FUENTE_OFICIAL",
    monthlyRevenue: "DECLARADO_USUARIO",
    monthlyPurchases: "DECLARADO_USUARIO",
    employees: "DECLARADO_USUARIO",
    fixedAssetsValue: "DECLARADO_USUARIO",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(scopedStorageKey("efp-business-context"));
      if (raw) {
        const parsed = JSON.parse(raw) as BusinessContext;
        if (parsed.ruc) setRuc(parsed.ruc);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.district) setDistrict(parsed.district);
        if (
          parsed.personType === "PERSONA_NATURAL" ||
          parsed.personType === "PERSONA_JURIDICA"
        ) {
          setPersonType(parsed.personType);
        }
        if (parsed.currentRegime && parsed.currentRegime !== "DESCONOCIDO") {
          setCurrentRegime(parsed.currentRegime);
        }
        if (parsed.restaurantSpecialty)
          setRestaurantSpecialty(parsed.restaurantSpecialty);
        if (parsed.ciiu === "5610" || parsed.ciiu === "5621")
          setCiiu(parsed.ciiu);
        if (parsed.monthlyRevenue !== undefined)
          setMonthlyRevenue(String(parsed.monthlyRevenue));
        if (parsed.annualRevenue !== undefined)
          setAnnualRevenue(String(parsed.annualRevenue));
        if (parsed.monthlyPurchasesWithInvoice !== undefined) {
          setMonthlyPurchasesWithInvoice(
            String(parsed.monthlyPurchasesWithInvoice)
          );
        }
        if (parsed.monthlyPurchasesWithoutInvoice !== undefined) {
          setMonthlyPurchasesWithoutInvoice(
            String(parsed.monthlyPurchasesWithoutInvoice)
          );
        }
        if (parsed.monthlyOperatingExpenses !== undefined) {
          setMonthlyOperatingExpenses(String(parsed.monthlyOperatingExpenses));
        }
        if (typeof parsed.needsFacturas === "boolean")
          setNeedsFacturas(parsed.needsFacturas);
        if (parsed.emittedReceipts && parsed.emittedReceipts.length > 0) {
          setEmittedReceipts(parsed.emittedReceipts);
        }
        if (parsed.establishmentCount !== undefined) {
          setEstablishmentCount(String(parsed.establishmentCount));
        }
        if (parsed.employees !== undefined) {
          setEmployeesPerShift(String(parsed.employees));
        }
        if (parsed.fixedAssetsValue !== undefined) {
          setFixedAssetsValue(String(parsed.fixedAssetsValue));
        }
        if (typeof parsed.hasCorporateLinkageOverLimit === "boolean") {
          setHasCorporateLinkageOverLimit(parsed.hasCorporateLinkageOverLimit);
        }
        if (typeof parsed.isForeignBranch === "boolean") {
          setIsForeignBranch(parsed.isForeignBranch);
        }
        if (parsed.dataOrigins) {
          setDataOrigins(parsed.dataOrigins);
        }
      }
    } catch {}
  }, []);

  const handleRucChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 11);
    setRuc(cleaned);
    if (cleaned.startsWith("20")) {
      setPersonType("PERSONA_JURIDICA");
    } else if (cleaned.startsWith("10") || cleaned.startsWith("15")) {
      setPersonType("PERSONA_NATURAL");
    }
  };

  const handleMonthlySalesChange = (val: string) => {
    setMonthlyRevenue(val);
    const num = Number(val);
    if (!Number.isNaN(num) && val.trim() !== "") {
      setAnnualRevenue(String(Math.round(num * 12)));
    } else {
      setAnnualRevenue("");
    }
  };

  const toggleReceipt = (receipt: ReceiptType) => {
    setEmittedReceipts((prev) => {
      const exists = prev.includes(receipt);
      const next = exists
        ? prev.filter((item) => item !== receipt)
        : [...prev, receipt];
      if (next.includes("FACTURA")) {
        setNeedsFacturas(true);
      }
      return next.length > 0 ? next : ["BOLETA"];
    });
  };

  const toggleOrigin = (field: string) => {
    setDataOrigins((prev) => ({
      ...prev,
      [field]:
        prev[field] === "VERIFICADO_FUENTE_OFICIAL"
          ? "DECLARADO_USUARIO"
          : "VERIFICADO_FUENTE_OFICIAL",
    }));
  };

  const applyPreset = (presetContext: BusinessContext) => {
    setRuc(presetContext.ruc || "10428519302");
    setBusinessName(presetContext.businessName || "Mi Restaurante");
    setDistrict(presetContext.district || "Cajamarca");
    setPersonType(presetContext.personType || "PERSONA_NATURAL");
    setCurrentRegime(presetContext.currentRegime && presetContext.currentRegime !== "DESCONOCIDO" ? presetContext.currentRegime : "NRUS");
    setRestaurantSpecialty(
      presetContext.restaurantSpecialty || "RESTAURANTE_MENU"
    );
    setCiiu(presetContext.ciiu === "5621" ? "5621" : "5610");
    setMonthlyRevenue(String(presetContext.monthlyRevenue ?? 4500));
    setAnnualRevenue(String(presetContext.annualRevenue ?? 54000));
    setMonthlyPurchasesWithInvoice(
      String(presetContext.monthlyPurchasesWithInvoice ?? 1500)
    );
    setMonthlyPurchasesWithoutInvoice(
      String(presetContext.monthlyPurchasesWithoutInvoice ?? 700)
    );
    setMonthlyOperatingExpenses(
      String(presetContext.monthlyOperatingExpenses ?? 900)
    );
    setNeedsFacturas(Boolean(presetContext.needsFacturas));
    setEmittedReceipts(presetContext.emittedReceipts || ["BOLETA"]);
    setEstablishmentCount(String(presetContext.establishmentCount ?? 1));
    setEmployeesPerShift(String(presetContext.employees ?? 2));
    setFixedAssetsValue(String(presetContext.fixedAssetsValue ?? 12000));
    setHasCorporateLinkageOverLimit(
      Boolean(presetContext.hasCorporateLinkageOverLimit)
    );
    setIsForeignBranch(Boolean(presetContext.isForeignBranch));
    if (presetContext.dataOrigins) setDataOrigins(presetContext.dataOrigins);
  };

  const buildContextObject = (): BusinessContext => {
    const parsedMonthlySales =
      monthlyRevenue.trim() !== "" ? Number(monthlyRevenue) : undefined;
    const parsedAnnualSales =
      annualRevenue.trim() !== ""
        ? Number(annualRevenue)
        : parsedMonthlySales !== undefined
          ? parsedMonthlySales * 12
          : undefined;

    const parsedPurchasesInv =
      monthlyPurchasesWithInvoice.trim() !== ""
        ? Number(monthlyPurchasesWithInvoice)
        : undefined;
    const parsedPurchasesNoInv =
      monthlyPurchasesWithoutInvoice.trim() !== ""
        ? Number(monthlyPurchasesWithoutInvoice)
        : 0;

    const totalMonthlyPurchases =
      parsedPurchasesInv !== undefined
        ? parsedPurchasesInv + parsedPurchasesNoInv
        : undefined;

    const parsedAssets =
      fixedAssetsValue.trim() !== "" ? Number(fixedAssetsValue) : undefined;
    const parsedEmployees =
      employeesPerShift.trim() !== "" ? Number(employeesPerShift) : undefined;
    const parsedEstablishments =
      establishmentCount.trim() !== "" ? Number(establishmentCount) : 1;

    const activityId =
      restaurantSpecialty === "CATERING_EVENTOS"
        ? "catering"
        : restaurantSpecialty === "CAFETERIA_FUENTE_SODA"
          ? "cafeteria"
          : restaurantSpecialty === "PICANTERIA_TRADICIONAL"
            ? "picanteria"
            : "restaurante";

    return {
      ruc: ruc.trim(),
      businessName: businessName.trim() || "Restaurante en Cajamarca",
      currentRegime,
      ciiu,
      restaurantSpecialty,
      purpose: "formalizar",
      sectorId: "restaurantes",
      activityId,
      otherActivity: businessName.trim(),
      department: "Cajamarca",
      province: "Cajamarca",
      district,
      legalPerson: personType === "PERSONA_JURIDICA" ? "juridica" : "natural",
      personType,
      hasPartners: personType === "PERSONA_JURIDICA",
      partnerCount: personType === "PERSONA_JURIDICA" ? 2 : 1,
      hasPhysicalLocation: true,
      hasLocal: true,
      servesPublic: true,
      hasEmployees: (parsedEmployees ?? 0) > 0,
      employeeCount: parsedEmployees ?? 0,
      employeeCountPerShift: parsedEmployees,
      employees: parsedEmployees,
      sellsOnline: false,
      preparesFood: true,
      importsGoods: false,
      exportsGoods: false,
      providesRegulatedService: false,
      customerType: needsFacturas ? "ambos" : "personas",
      monthlyRevenue: parsedMonthlySales,
      annualRevenue: parsedAnnualSales,
      monthlyPurchases: totalMonthlyPurchases,
      monthlyPurchasesWithInvoice: parsedPurchasesInv,
      monthlyPurchasesWithoutInvoice: parsedPurchasesNoInv,
      monthlyOperatingExpenses:
        monthlyOperatingExpenses.trim() !== ""
          ? Number(monthlyOperatingExpenses)
          : 0,
      annualPurchases:
        totalMonthlyPurchases !== undefined
          ? totalMonthlyPurchases * 12
          : undefined,
      fixedAssets: parsedAssets,
      fixedAssetsValue: parsedAssets,
      establishmentCount: parsedEstablishments,
      needsInvoices: needsFacturas,
      needsFacturas,
      emittedReceipts,
      hasMultipleLocations: parsedEstablishments > 1,
      hasCorporateLinkageOverLimit,
      isForeignBranch,
      foreignSourceIncome: false,
      collectsPersonalData: false,
      dataOrigins,
    };
  };

  const currentContext = buildContextObject();
  const liveEval = RuleEngine.evaluate(currentContext, seedCatalog);

  const handleSaveAndEvaluate = async () => {
    setSaving(true);
    try {
      const ctx = buildContextObject();
      localStorage.setItem(
        scopedStorageKey("efp-business-context"),
        JSON.stringify(ctx)
      );

      try {
        const activeParticipant = localStorage.getItem(
          "crea-active-participant-code"
        );
        if (activeParticipant) {
          const rawMap = localStorage.getItem("crea-research-records-v1");
          const map = rawMap ? JSON.parse(rawMap) : {};
          const existing = map[activeParticipant] || {
            participantCode: activeParticipant,
            consentAccepted: true,
          };
          const visited = new Set<string>(
            existing.intervention?.modulesVisited || []
          );
          visited.add("Mi restaurante");
          existing.intervention = {
            participantCode: activeParticipant,
            modulesVisited: Array.from(visited),
            completedDiagnostic: true,
            usedSimulator: Boolean(existing.intervention?.usedSimulator),
            reviewedObligations: Boolean(
              existing.intervention?.reviewedObligations
            ),
            consultedCreaIa: Boolean(existing.intervention?.consultedCreaIa),
            firstSessionTimestamp:
              existing.intervention?.firstSessionTimestamp ||
              new Date().toISOString(),
            lastSessionTimestamp: new Date().toISOString(),
          };
          map[activeParticipant] = existing;
          localStorage.setItem("crea-research-records-v1", JSON.stringify(map));
        }
      } catch {}

      await saveBusinessToFirestore(ctx);
      router.push("/negocios?seccion=diagnostico");
    } finally {
      setSaving(false);
    }
  };

  const renderOriginToggle = (field: string, verifiedLabel = "Fuente SUNAT") => {
    const isVerified = dataOrigins[field] === "VERIFICADO_FUENTE_OFICIAL";
    return (
      <button
        type="button"
        onClick={() => toggleOrigin(field)}
        title="Haz clic para alternar entre dato verificado en fuente oficial y dato declarado por el usuario"
        className={
          "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition " +
          (isVerified
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100")
        }
      >
        {isVerified ? `✓ ${verifiedLabel}` : "✎ Declarado"}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header & Security Notice */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              🍽️ Módulo: Mi restaurante · Cajamarca, Perú
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Ficha Tributaria de Mi Restaurante
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Registra en lenguaje sencillo las características de tu
              restaurante formalizado. El sistema distingue entre los datos{" "}
              <strong>declarados por el usuario</strong> y los{" "}
              <strong>verificados mediante fuentes oficiales</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-950 shadow-2xs">
            <p className="font-extrabold">🔒 Garantía de seguridad tributaria</p>
            <p className="mt-0.5">
              Crea <strong>nunca solicita tu Clave SOL</strong> ni credenciales
              privadas de SUNAT.
            </p>
          </div>
        </div>

        {/* Quick Preset Selector for Cajamarca Restaurants */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              ⚡ Cargar perfil de ejemplo de restaurante en Cajamarca:
            </span>
            <a
              href="https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 underline hover:text-blue-800"
            >
              Verificar RUC en Consulta RUC Oficial SUNAT ↗
            </a>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_PRESETS.map((preset) => {
              const isSelected =
                businessName === preset.context.businessName &&
                ruc === preset.context.ruc;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.context)}
                  className={
                    "rounded-xl border p-3 text-left transition " +
                    (isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/15"
                      : "border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white")
                  }
                >
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    {preset.badge}
                  </span>
                  <span className="mt-1 block text-xs font-extrabold text-slate-900">
                    {preset.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Well-Proportioned Stepper Navigation */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, idx) => {
            const active = step === idx;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(idx)}
                className={
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition " +
                  (active
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300")
                }
              >
                <span
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black " +
                    (active
                      ? "bg-white text-blue-600"
                      : "bg-blue-50 text-blue-700")
                  }
                >
                  {s.num}
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold">
                    {s.title}
                  </span>
                  <span
                    className={
                      "block text-[11px] " +
                      (active ? "text-blue-100" : "text-slate-500")
                    }
                  >
                    {s.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
          {/* Left Form Card (8 cols on desktop for generous, aligned inputs) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-8">
            {step === 0 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3.5">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Paso 1: Identificación RUC, Contribuyente y Régimen Actual
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Debajo de cada campo puedes alternar entre{" "}
                    <strong>✓ Fuente SUNAT</strong> y{" "}
                    <strong>✎ Declarado</strong> según cómo obtuviste el dato.
                  </p>
                </div>

                {/* Row 1: RUC + Nombre comercial (Aligned h-11 inputs) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ruc-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Número de RUC (11 dígitos)
                    </label>
                    <input
                      id="ruc-input"
                      type="text"
                      value={ruc}
                      onChange={(e) => handleRucChange(e.target.value)}
                      placeholder="Ej. 10428519302 o 20608419257"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {ruc.length === 11
                          ? `Último dígito: «${ruc[10]}» (cronograma SUNAT)`
                          : "Ingresa los 11 dígitos del RUC"}
                      </span>
                      {renderOriginToggle("ruc", "Ficha RUC")}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="name-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Nombre comercial del restaurante
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej. Restaurante El Cumbe"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Nombre con el que atiendes en Cajamarca
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Identificación
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Tipo de contribuyente + Régimen actual (Both exact h-11 height) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Tipo de contribuyente
                    </span>
                    <div className="mt-1.5 grid h-11 grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                      <button
                        type="button"
                        onClick={() => setPersonType("PERSONA_NATURAL")}
                        className={
                          "whitespace-nowrap rounded-lg px-2 text-xs font-bold transition " +
                          (personType === "PERSONA_NATURAL"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        RUC 10 · P. Natural
                      </button>
                      <button
                        type="button"
                        onClick={() => setPersonType("PERSONA_JURIDICA")}
                        className={
                          "whitespace-nowrap rounded-lg px-2 text-xs font-bold transition " +
                          (personType === "PERSONA_JURIDICA"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        RUC 20 · P. Jurídica
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        NRUS solo admite Persona Natural
                      </span>
                      {renderOriginToggle("personType", "Consulta RUC")}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="regime-select"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Régimen tributario actual
                    </label>
                    <select
                      id="regime-select"
                      value={currentRegime}
                      onChange={(e) =>
                        setCurrentRegime(
                          e.target.value as TaxRegimeCode | "SIN_REGIMEN"
                        )
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="NRUS">Nuevo RUS (NRUS)</option>
                      <option value="RER">
                        Régimen Especial de Renta (RER)
                      </option>
                      <option value="RMT">
                        Régimen MYPE Tributario (RMT)
                      </option>
                      <option value="RG">Régimen General (RG)</option>
                    </select>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Régimen registrado hoy en SUNAT
                      </span>
                      {renderOriginToggle("currentRegime", "Ficha RUC")}
                    </div>
                  </div>
                </div>

                {/* Row 3: Actividad económica CIIU + Distrito (Concise option text so it never clips) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="specialty-select"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Actividad económica gastronómica (CIIU)
                    </label>
                    <select
                      id="specialty-select"
                      value={restaurantSpecialty}
                      onChange={(e) => {
                        const val = e.target.value as RestaurantActivityCode;
                        setRestaurantSpecialty(val);
                        setCiiu(val === "CATERING_EVENTOS" ? "5621" : "5610");
                      }}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="RESTAURANTE_MENU">
                        5610 · Restaurante de menú y carta
                      </option>
                      <option value="POLLERIA_PARRILLERIA">
                        5610 · Pollería, parrillería o chifa
                      </option>
                      <option value="PICANTERIA_TRADICIONAL">
                        5610 · Picantería o comida típica
                      </option>
                      <option value="CAFETERIA_FUENTE_SODA">
                        5610 · Cafetería, juguería o sanguchería
                      </option>
                      <option value="CATERING_EVENTOS">
                        5621 · Catering y comidas por encargo
                      </option>
                    </select>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Clasificación CIIU Rev. 4 aplicable
                      </span>
                      {renderOriginToggle("ciiu", "Ficha RUC")}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="district-select"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Distrito del establecimiento en Cajamarca
                    </label>
                    <select
                      id="district-select"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="Cajamarca">Cajamarca (Cercado)</option>
                      <option value="Los Baños del Inca">
                        Los Baños del Inca
                      </option>
                      <option value="Llacanora">Llacanora</option>
                      <option value="Jesús">Jesús</option>
                      <option value="Namora">Namora</option>
                      <option value="Magdalena">Magdalena</option>
                    </select>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Provincia y departamento de Cajamarca
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Ubicación
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    Siguiente: Ventas, Compras y Comprobantes →
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3.5">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Paso 2: Ventas, Compras de Insumos y Comprobantes
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Distingue tus compras con Factura (que dan crédito fiscal de
                    IGV) de las compras con Boleta o en mercado.
                  </p>
                </div>

                {/* Row 1: Ventas mensuales + Ventas anuales (Aligned h-11 inputs) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="monthly-sales"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Ventas brutas mensuales (S/)
                    </label>
                    <input
                      id="monthly-sales"
                      type="number"
                      min={0}
                      value={monthlyRevenue}
                      onChange={(e) => handleMonthlySalesChange(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Tope mensual NRUS: S/ 8,000
                      </span>
                      {renderOriginToggle("monthlyRevenue", "Declaración/RVIE")}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="annual-sales"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Ventas brutas anuales proyectadas (S/)
                    </label>
                    <input
                      id="annual-sales"
                      type="number"
                      min={0}
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Topes: NRUS S/ 96k · RER S/ 525k · RMT 1,700 UIT
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Anual (×12)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Compras CON Factura + Compras SIN Factura (Aligned h-11 inputs) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="purchases-invoice"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Compras mensuales CON Factura (S/)
                    </label>
                    <input
                      id="purchases-invoice"
                      type="number"
                      min={0}
                      value={monthlyPurchasesWithInvoice}
                      onChange={(e) =>
                        setMonthlyPurchasesWithInvoice(e.target.value)
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        ✓ Otorga crédito fiscal de IGV (18%)
                      </span>
                      {renderOriginToggle("monthlyPurchases", "Registro RCE")}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="purchases-no-invoice"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Compras mensuales SIN Factura / Boleta (S/)
                    </label>
                    <input
                      id="purchases-no-invoice"
                      type="number"
                      min={0}
                      value={monthlyPurchasesWithoutInvoice}
                      onChange={(e) =>
                        setMonthlyPurchasesWithoutInvoice(e.target.value)
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-amber-700">
                        No otorga crédito fiscal de IGV
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Boleta / Mercado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Otros gastos operativos formales (Full-width clean row) */}
                <div>
                  <label
                    htmlFor="operating-expenses"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Otros gastos operativos formales al mes (Planilla, alquiler
                    con recibo, luz, agua) (S/)
                  </label>
                  <input
                    id="operating-expenses"
                    type="number"
                    min={0}
                    value={monthlyOperatingExpenses}
                    onChange={(e) =>
                      setMonthlyOperatingExpenses(e.target.value)
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Gastos deducibles para calcular la Renta Anual en el RMT y
                      Régimen General
                    </span>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      Deducible RMT / RG
                    </span>
                  </div>
                </div>

                {/* Row 4: Necesidad de emitir Facturas (Full-width 2-column horizontal cards) */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="block text-xs font-bold text-slate-800">
                    ¿Tu restaurante necesita emitir Facturas a empresas o
                    instituciones?
                  </span>
                  <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setNeedsFacturas(false)}
                      className={
                        "flex h-11 items-center justify-center rounded-xl border px-4 text-xs font-bold transition " +
                        (!needsFacturas
                          ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/15"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                      }
                    >
                      No, solo emite Boletas de Venta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNeedsFacturas(true);
                        if (!emittedReceipts.includes("FACTURA")) {
                          setEmittedReceipts([...emittedReceipts, "FACTURA"]);
                        }
                      }}
                      className={
                        "flex h-11 items-center justify-center rounded-xl border px-4 text-xs font-bold transition " +
                        (needsFacturas
                          ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/15"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                      }
                    >
                      Sí, necesita emitir Facturas (RUC 20)
                    </button>
                  </div>
                </div>

                {/* Row 5: Comprobantes utilizados (Full-width 4-column equal pills) */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="block text-xs font-bold text-slate-800">
                    Comprobantes de pago utilizados en el restaurante
                  </span>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(
                      [
                        { code: "BOLETA", label: "Boleta de Venta" },
                        { code: "FACTURA", label: "Factura" },
                        { code: "TICKET", label: "Ticket POS" },
                        { code: "NOTA_CREDITO", label: "Nota de Crédito" },
                      ] as const
                    ).map((item) => {
                      const active = emittedReceipts.includes(item.code);
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => toggleReceipt(item.code)}
                          className={
                            "flex h-10 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-bold transition " +
                            (active
                              ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/15"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                          }
                        >
                          {active ? "✓ " : ""}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    Siguiente: Locales, Personal y Activos →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3.5">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Paso 3: Establecimientos, Trabajadores por Turno y Activos
                    Fijos
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Estos datos son obligatorios para verificar las
                    restricciones del Nuevo RUS y del Régimen Especial (RER).
                  </p>
                </div>

                {/* Row 1: Establecimientos + Trabajadores por turno (Aligned h-11 inputs) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="establishments-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Número de establecimientos abiertos
                    </label>
                    <input
                      id="establishments-input"
                      type="number"
                      min={1}
                      max={20}
                      value={establishmentCount}
                      onChange={(e) => setEstablishmentCount(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        NRUS permite máximo 1 local (unidad de explotación)
                      </span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Tope NRUS: 1
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="workers-shift"
                      className="block text-xs font-bold text-slate-800"
                    >
                      Cantidad máxima de trabajadores por turno
                    </label>
                    <input
                      id="workers-shift"
                      type="number"
                      min={0}
                      max={200}
                      value={employeesPerShift}
                      onChange={(e) => setEmployeesPerShift(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        El RER permite máximo 10 trabajadores por turno
                      </span>
                      {renderOriginToggle("employees", "Planilla PLAME")}
                    </div>
                  </div>
                </div>

                {/* Row 2: Valor de activos fijos (Full-width clean row) */}
                <div>
                  <label
                    htmlFor="fixed-assets"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Valor estimado de activos fijos del restaurante (hornos,
                    congeladoras, cocina industrial, mobiliario) (S/)
                  </label>
                  <input
                    id="fixed-assets"
                    type="number"
                    min={0}
                    value={fixedAssetsValue}
                    onChange={(e) => setFixedAssetsValue(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Sin incluir predios ni vehículos · Límite NRUS: S/ 70,000
                      · Límite RER: S/ 126,000
                    </span>
                    {renderOriginToggle("fixedAssetsValue", "Inventario/Libros")}
                  </div>
                </div>

                {/* Row 3: Condiciones RMT */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-800">
                    Condiciones adicionales de exclusión del RMT (D. Leg. N.°
                    1269):
                  </span>
                  <div className="mt-2.5 space-y-2.5 text-xs text-slate-700">
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={hasCorporateLinkageOverLimit}
                        onChange={(e) =>
                          setHasCorporateLinkageOverLimit(e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      <span>
                        ¿Tiene vinculación económica con otras empresas cuyos
                        ingresos conjuntos superen las 1,700 UIT?
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isForeignBranch}
                        onChange={(e) => setIsForeignBranch(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      <span>
                        ¿Es sucursal o establecimiento permanente de una empresa
                        constituida en el exterior?
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveAndEvaluate}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving
                      ? "Guardando ficha..."
                      : "Guardar ficha e ir a «Mi diagnóstico» →"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Card (4 cols on desktop) */}
          <aside className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Vista previa en tiempo real
              </span>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">
                {currentContext.businessName}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                RUC: {currentContext.ruc || "Sin registrar"} · CIIU{" "}
                {currentContext.ciiu}
              </p>

              {liveEval.currentRegimeDiagnostic && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Régimen actual:{" "}
                      {liveEval.currentRegimeDiagnostic.currentRegime}
                    </span>
                    <span
                      className={
                        "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                        (liveEval.currentRegimeDiagnostic.status ===
                        "COMPATIBLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : liveEval.currentRegimeDiagnostic.status ===
                              "INCOMPATIBLE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800")
                      }
                    >
                      {STATUS_LABEL[liveEval.currentRegimeDiagnostic.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {liveEval.currentRegimeDiagnostic.summary}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <span className="block text-xs font-bold text-slate-700">
                  Evaluación de los 4 regímenes:
                </span>
                {liveEval.taxRecommendations.map((rec) => (
                  <div
                    key={rec.regime}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs"
                  >
                    <span className="min-w-0 truncate font-bold text-slate-800">
                      {rec.regime} ·{" "}
                      <span className="font-medium text-slate-600">
                        {rec.name.replace(/\s*\(.*?\)/, "")}
                      </span>
                    </span>
                    <span
                      className={
                        "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                        (rec.status === "COMPATIBLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : rec.status === "INCOMPATIBLE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800")
                      }
                    >
                      {STATUS_LABEL[rec.status]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAndEvaluate}
                className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                Guardar y ver diagnóstico completo →
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
