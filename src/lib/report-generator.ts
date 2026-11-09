import { RuleEngine, RULE_ENGINE_VERSION } from "./rule-engine";
import { seedCatalog } from "./seed-catalog";
import { simulateRestaurantTaxes } from "./tax-simulator";
import { getRestaurantObligations } from "./sunat-calendar";
import { BusinessContext } from "./types";

export interface DiagnosticReportData {
  generatedAtIso: string;
  generatedAtFormatted: string;
  ruleEngineVersion: string;
  restaurantIdentification: {
    businessName: string;
    ruc: string;
    personType: string;
    ciiu: string;
    location: string;
    currentRegime: string;
  };
  evaluatedDataWithOrigins: Array<{
    field: string;
    value: string;
    origin: string;
  }>;
  currentRegimeEvaluation: {
    regimeCode: string;
    regimeName: string;
    status: string;
    summary: string;
    breachedConditions: string[];
    missingConditions: string[];
  };
  alternativesEvaluation: Array<{
    regimeCode: string;
    regimeName: string;
    status: string;
    reasons: string[];
    breachedConditions: string[];
    estimatedMonthlyPayment: string;
  }>;
  mainObligations: Array<{
    title: string;
    frequency: string;
    description: string;
  }>;
  recommendedActions: string[];
  officialSources: Array<{
    title: string;
    entity: string;
    legalBasis: string;
    version: string;
    effectiveDate: string;
    reviewedAt: string;
    url: string;
  }>;
  mandatoryDisclaimer: string;
}

export function buildDiagnosticReportData(
  context: BusinessContext
): DiagnosticReportData {
  const now = new Date();
  const evaluation = RuleEngine.evaluate(context, seedCatalog);
  const simulation = simulateRestaurantTaxes(context);
  const obligationsPlan = getRestaurantObligations(context);

  const origins = context.dataOrigins ?? {};
  const formatOrigin = (key: string) =>
    origins[key] === "VERIFICADO_FUENTE_OFICIAL"
      ? "Verificado en fuente oficial (SUNAT)"
      : "Declarado por el usuario";

  const evaluatedDataWithOrigins = [
    {
      field: "Número de RUC",
      value: context.ruc || "No registrado",
      origin: formatOrigin("ruc"),
    },
    {
      field: "Tipo de contribuyente",
      value:
        context.personType === "PERSONA_JURIDICA" ||
        context.legalPerson === "juridica"
          ? "Persona Jurídica (RUC 20)"
          : "Persona Natural con Negocio (RUC 10)",
      origin: formatOrigin("personType"),
    },
    {
      field: "Régimen tributario actual",
      value: context.currentRegime || "No especificado",
      origin: formatOrigin("currentRegime"),
    },
    {
      field: "Actividad económica CIIU",
      value: `${context.ciiu || "5610"} - Actividades de restaurantes y servicio móvil de comidas`,
      origin: formatOrigin("ciiu"),
    },
    {
      field: "Ventas brutas mensuales / anuales",
      value:
        context.monthlyRevenue !== undefined
          ? `S/ ${context.monthlyRevenue.toLocaleString("es-PE")} / mes (S/ ${(context.annualRevenue ?? context.monthlyRevenue * 12).toLocaleString("es-PE")} / año)`
          : "Sin dato registrado",
      origin: formatOrigin("monthlyRevenue"),
    },
    {
      field: "Compras mensuales totales (con y sin factura)",
      value:
        context.monthlyPurchases !== undefined
          ? `S/ ${context.monthlyPurchases.toLocaleString("es-PE")} / mes (Con factura: S/ ${(context.monthlyPurchasesWithInvoice ?? context.monthlyPurchases).toLocaleString("es-PE")} | Sin factura: S/ ${(context.monthlyPurchasesWithoutInvoice ?? 0).toLocaleString("es-PE")})`
          : "Sin dato registrado",
      origin: formatOrigin("monthlyPurchases"),
    },
    {
      field: "Necesidad de emitir Facturas",
      value:
        context.needsFacturas ?? context.needsInvoices
          ? "Sí requiere emitir Facturas a empresas/instituciones"
          : "No (solo Boleta de Venta a consumidores finales)",
      origin: "Declarado por el usuario",
    },
    {
      field: "Número de establecimientos abiertos",
      value: `${context.establishmentCount ?? (context.hasMultipleLocations ? 2 : 1)} local(es)`,
      origin: "Declarado por el usuario",
    },
    {
      field: "Cantidad máxima de trabajadores por turno",
      value:
        context.employees !== undefined
          ? `${context.employees} trabajador(es) por turno`
          : "Sin dato registrado",
      origin: formatOrigin("employees"),
    },
    {
      field: "Valor de activos fijos (equipos de cocina y salón)",
      value:
        context.fixedAssetsValue !== undefined
          ? `S/ ${context.fixedAssetsValue.toLocaleString("es-PE")}`
          : "Sin dato registrado",
      origin: formatOrigin("fixedAssetsValue"),
    },
  ];

  const currentDiag = evaluation.currentRegimeDiagnostic;

  const alternativesEvaluation = evaluation.taxRecommendations.map((rec) => {
    const sim = simulation.regimes[rec.regime];
    return {
      regimeCode: rec.regime,
      regimeName: rec.name,
      status: rec.status,
      reasons: rec.reasons,
      breachedConditions: rec.breachedConditions,
      estimatedMonthlyPayment:
        sim && sim.canEstimate
          ? `S/ ${sim.totalMonthlyTaxEstimated.toFixed(2)} / mes (IGV: S/ ${sim.monthlyIgvPayable.toFixed(2)} + Renta: S/ ${sim.monthlyIncomeTaxPayable.toFixed(2)})`
          : sim?.insufficientDataReason || "No aplicable",
    };
  });

  const recommendedActions: string[] = [];
  if (currentDiag?.status === "INCOMPATIBLE") {
    recommendedActions.push(
      `Regularizar el régimen tributario actual (${currentDiag.regimeName}) debido al incumplimiento de condiciones obligatorias: ${currentDiag.breachedConditions.join("; ")}.`
    );
  }
  if (currentDiag?.status === "INFORMACION_INSUFICIENTE") {
    recommendedActions.push(
      `Completar los datos pendientes en la ficha del restaurante (${currentDiag.missingConditions.join("; ")}) para obtener un diagnóstico definitivo.`
    );
  }
  recommendedActions.push(
    "Exigir Factura electrónica en todas las compras de insumos gastronómicos (carnes, abarrotes, bebidas, GLP y servicios) para respaldar costos y crédito fiscal de IGV."
  );
  if (obligationsPlan.scheduleLookup.dueDate) {
    recommendedActions.push(
      `Presentar la declaración mensual antes de la fecha oficial de vencimiento SUNAT (${obligationsPlan.scheduleLookup.dueDate} para el periodo ${obligationsPlan.scheduleLookup.period}).`
    );
  } else {
    recommendedActions.push(
      "Verificar el último dígito del RUC en el Cronograma de Obligaciones Mensuales de SUNAT para evitar multas por declaración fuera de plazo."
    );
  }

  const officialSources = seedCatalog.sources
    .filter((s) => s.verification === "VIGENTE")
    .map((s) => ({
      title: s.title,
      entity: s.entity,
      legalBasis: s.legalBasis || "Normativa tributaria vigente SUNAT",
      version: s.version || "2026.1",
      effectiveDate: s.effectiveDate || "2026-01-01",
      reviewedAt: s.reviewedAt,
      url: s.url,
    }));

  return {
    generatedAtIso: now.toISOString(),
    generatedAtFormatted: now.toLocaleString("es-PE", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    ruleEngineVersion: evaluation.ruleEngineVersion || RULE_ENGINE_VERSION,
    restaurantIdentification: {
      businessName: context.businessName || "Restaurante en evaluación",
      ruc: context.ruc || "Pendiente de registro",
      personType:
        context.personType === "PERSONA_JURIDICA" ||
        context.legalPerson === "juridica"
          ? "Persona Jurídica (RUC 20)"
          : "Persona Natural con Negocio (RUC 10)",
      ciiu: `${context.ciiu || "5610"} - Actividades de restaurantes y de servicio móvil de comidas`,
      location: `${context.district || "Cajamarca"}, ${context.province || "Cajamarca"}, ${context.department || "Cajamarca"}`,
      currentRegime: currentDiag?.regimeName || "No especificado",
    },
    evaluatedDataWithOrigins,
    currentRegimeEvaluation: {
      regimeCode: currentDiag?.currentRegime || "SIN_REGIMEN",
      regimeName: currentDiag?.regimeName || "Sin régimen registrado",
      status: currentDiag?.status || "INFORMACION_INSUFICIENTE",
      summary:
        currentDiag?.summary ||
        "No se ha especificado el régimen actual del restaurante.",
      breachedConditions: currentDiag?.breachedConditions || [],
      missingConditions: currentDiag?.missingConditions || [],
    },
    alternativesEvaluation,
    mainObligations: obligationsPlan.obligations.map((o) => ({
      title: o.title,
      frequency: o.frequency,
      description: o.description,
    })),
    recommendedActions,
    officialSources,
    mandatoryDisclaimer:
      "NOTA DE ORIENTACIÓN Y RESPONSABILIDAD: El presente reporte constituye una herramienta de orientación, diagnóstico y organización tributaria generada por el sistema Crea sobre la base de la normativa oficial de SUNAT vigente y los datos registrados por el establecimiento. No reemplaza una asesoría contable o tributaria personalizada ni constituye una declaración o liquidación definitiva ante la Administración Tributaria (SUNAT).",
  };
}

/**
 * Abre una ventana de documento estructurado lista para guardar o imprimir como PDF nativo.
 */
export function downloadDiagnosticReportPdf(context: BusinessContext): void {
  if (typeof window === "undefined") return;
  const report = buildDiagnosticReportData(context);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Evaluación Tributaria - ${report.restaurantIdentification.businessName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 32px; line-height: 1.45; font-size: 12.5px; }
    h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
    h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .meta { font-size: 11.5px; color: #475569; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 11px; }
    .COMPATIBLE { background: #dcfce7; color: #166534; }
    .INCOMPATIBLE { background: #fee2e2; color: #991b1b; }
    .INFORMACION_INSUFICIENTE { background: #fef3c7; color: #92400e; }
    .disclaimer { margin-top: 20px; padding: 12px; background: #f8fafc; border-left: 4px solid #0284c7; font-size: 11.5px; color: #334155; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Reporte de Diagnóstico y Orientación Tributaria para Restaurantes</h1>
  <div class="meta">
    <strong>Sistema Crea · Cajamarca, Perú</strong> | Fecha de evaluación: ${report.generatedAtFormatted} | Versión de reglas aplicadas: <strong>${report.ruleEngineVersion}</strong>
  </div>

  <h2>1. Identificación del Restaurante</h2>
  <table>
    <tr><th>Nombre comercial</th><td>${report.restaurantIdentification.businessName}</td><th>RUC</th><td>${report.restaurantIdentification.ruc}</td></tr>
    <tr><th>Tipo de contribuyente</th><td>${report.restaurantIdentification.personType}</td><th>Régimen actual</th><td>${report.restaurantIdentification.currentRegime}</td></tr>
    <tr><th>Actividad económica</th><td>${report.restaurantIdentification.ciiu}</td><th>Ubicación</th><td>${report.restaurantIdentification.location}</td></tr>
  </table>

  <h2>2. Datos Utilizados en el Diagnóstico (Declarados vs. Verificados)</h2>
  <table>
    <thead><tr><th>Característica evaluada</th><th>Valor registrado</th><th>Origen del dato</th></tr></thead>
    <tbody>
      ${report.evaluatedDataWithOrigins
        .map(
          (item) =>
            `<tr><td>${item.field}</td><td>${item.value}</td><td>${item.origin}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>3. Evaluación del Régimen Tributario Actual</h2>
  <p>
    <strong>Régimen evaluado:</strong> ${report.currentRegimeEvaluation.regimeName} &nbsp;|&nbsp;
    <strong>Resultado:</strong> <span class="badge ${report.currentRegimeEvaluation.status}">${report.currentRegimeEvaluation.status}</span>
  </p>
  <p>${report.currentRegimeEvaluation.summary}</p>
  ${
    report.currentRegimeEvaluation.breachedConditions.length > 0
      ? `<p><strong>Condiciones incumplidas detectadas:</strong></p><ul>${report.currentRegimeEvaluation.breachedConditions
          .map((c) => `<li>${c}</li>`)
          .join("")}</ul>`
      : ""
  }

  <h2>4. Evaluación de Alternativas Tributarias Compatibles</h2>
  <table>
    <thead><tr><th>Régimen</th><th>Estado</th><th>Sustento de evaluación / Condiciones</th><th>Estimación mensual orientativa</th></tr></thead>
    <tbody>
      ${report.alternativesEvaluation
        .map(
          (alt) => `<tr>
            <td><strong>${alt.regimeName} (${alt.regimeCode})</strong></td>
            <td><span class="badge ${alt.status}">${alt.status}</span></td>
            <td>${
              alt.breachedConditions.length > 0
                ? alt.breachedConditions.join(" ")
                : alt.reasons.join(" ")
            }</td>
            <td>${alt.estimatedMonthlyPayment}</td>
          </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>5. Obligaciones Tributarias Principales y Acciones Recomendadas</h2>
  <ul>
    ${report.mainObligations
      .map(
        (o) =>
          `<li><strong>[${o.frequency}] ${o.title}:</strong> ${o.description}</li>`
      )
      .join("")}
  </ul>
  <p><strong>Acciones recomendadas para el restaurante:</strong></p>
  <ol>
    ${report.recommendedActions.map((a) => `<li>${a}</li>`).join("")}
  </ol>

  <h2>6. Fuentes Oficiales Verificadas (SUNAT)</h2>
  <table>
    <thead><tr><th>Fuente oficial</th><th>Base legal</th><th>Versión / Vigencia</th><th>Revisión</th><th>Enlace oficial</th></tr></thead>
    <tbody>
      ${report.officialSources
        .map(
          (s) =>
            `<tr><td>${s.title} (${s.entity})</td><td>${s.legalBasis}</td><td>v${s.version} (${s.effectiveDate})</td><td>${s.reviewedAt}</td><td>${s.url}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="disclaimer">
    ${report.mandatoryDisclaimer}
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

  const printWin = window.open("", "_blank", "width=960,height=800");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
}
