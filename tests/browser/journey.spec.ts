import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { choose, fillOrigins, fillProfile } from "../helpers/assessment";

const basicAnswers = (page: Page, regime?: string) => fillProfile(page, "Mi negocio ya está formalizado", regime);

async function noOverflow(page: Page) {
  const width = page.viewportSize()!.width;
  expect(await page.evaluate((limit) => document.documentElement.scrollWidth <= limit + 1, width)).toBe(true);
}

async function accessibility(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations.map(({ id, nodes }) => [id, nodes.map(({ target }) => target)])).toEqual([]);
}

test("inicio, validación, revisión y diagnóstico con datos completos", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Formaliza tu negocio gastronómico");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await noOverflow(page);
  await accessibility(page);
  await page.getByRole("link", { name: "Evaluar mi negocio", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Evalúa tu negocio gastronómico", exact: true })).toBeVisible();
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveCount(0);
  if (info.project.name === "movil") {
    await page.screenshot({ path: info.outputPath("crea-evaluacion-movil.png"), fullPage: true });
  }
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Selecciona la etapa de tu negocio.")).toBeVisible();
  await expect(page.getByLabel("Nombre del restaurante (opcional)")).toHaveCount(0);
  await basicAnswers(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Ventas y compras" })).toBeFocused();
  await fillOrigins(page);
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveValue("");
  await page.getByLabel("Ventas anuales", { exact: true }).fill("54000");
  await page.getByLabel("Compras anuales", { exact: true }).fill("26400");
  await page.getByLabel("Ingresos brutos anuales").fill("54000");
  await page.getByLabel("Compras brutas anuales").fill("26400");
  await page.getByLabel("Ventas del mes más alto").fill("4500");
  await page.getByLabel("Compras del mes más alto").fill("2200");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Valor de los equipos y muebles del negocio").fill("12000");
  await page.getByLabel("Máximo de trabajadores en un turno").fill("2");
  await page.getByLabel("Número de locales o unidades de operación").fill("1");
  await choose(page, /actividades excluidas del Nuevo RUS/, "No");
  await choose(page, /actividades excluidas del RER/, "No");
  await choose(page, /domiciliado en Perú/, "Sí");
  await choose(page, /ejercicio anterior superaron/, "No");
  await page.getByRole("group", { name: /sucursal, agencia/ }).getByRole("radio", { name: "No", exact: true }).check();
  await page.getByRole("group", { name: /vinculado por capital/ }).getByRole("radio", { name: "No", exact: true }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del restaurante (opcional)").fill("Restaurante de prueba");
  await page.getByRole("button", { name: "Cambiar ventas del año" }).click();
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveValue("54000");
  await expect(page.getByLabel("Compras anuales", { exact: true })).toHaveCount(0);
  await page.getByLabel("Ventas anuales", { exact: true }).fill("55000");
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await expect(page.getByRole("button", { name: "Cambiar ventas del año" })).toBeFocused();
  await expect(page.getByText("S/ 55000")).toBeVisible();
  await expect(page.getByLabel("Nombre del restaurante (opcional)")).toHaveValue("Restaurante de prueba");
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByRole("heading", { name: "Tu diagnóstico", exact: true })).toBeVisible();
  await expect(page.getByText("Compatible según tus datos", { exact: true })).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Ver mis obligaciones" })).toBeVisible();
  if (info.project.name === "escritorio") {
    await page.screenshot({ path: info.outputPath("crea-resultados-escritorio.png") });
  }
  await page.getByText("Ver las reglas evaluadas", { exact: true }).first().click();
  await expect(page.getByText("Las ventas están dentro de los topes mensual y anual.")).toBeVisible();
  await noOverflow(page);
  await accessibility(page);

  await page.getByRole("link", { name: "Ir al simulador" }).click();
  await expect(page.getByRole("heading", { name: "Simula tus impuestos", exact: true })).toBeFocused();
  await page.getByLabel("Ventas del mes", { exact: true }).fill("11050");
  await page.getByLabel("Compras con factura", { exact: true }).fill("5900");
  await page.getByLabel("Compras sin factura", { exact: true }).fill("0");
  await page.getByLabel("Otros gastos sustentados").fill("0");
  await page.getByLabel("Crédito fiscal de las facturas (opcional)").fill("900");
  await page.getByRole("checkbox", { name: /tasa especial/ }).check();
  await page.getByRole("button", { name: "Calcular estimación" }).click();
  await expect(page.getByRole("heading", { name: "Resultados del simulador" })).toBeFocused();
  await expect(page.getByText("Escenario orientativo con IGV de ventas de 10.5 %", { exact: false })).toBeVisible();

  await page.getByRole("link", { name: "Obligaciones", exact: true }).click();
  await expect(page.getByLabel("Periodo tributario")).toBeVisible();
  await expect(page.getByLabel("Último dígito del RUC")).toBeHidden();
  await page.getByText("Consultar vencimiento", { exact: true }).click();
  await page.getByLabel("Periodo tributario").selectOption("2026-03");
  await page.getByLabel("Último dígito del RUC").selectOption("2");
  await expect(page.getByText("21 de abril de 2026")).toBeVisible();
  await page.getByRole("checkbox", { name: /Marcar tarea:/ }).first().check();
  await expect(page.getByText(/1 de \d+ marcadas/)).toBeVisible();
  await page.getByRole("link", { name: "Reportes", exact: true }).click();
  await expect(page.getByRole("article", { name: "Vista previa del reporte" })).toContainText("2026.4-GASTRONOMIA-CAJ");
  await expect(page.getByRole("article", { name: "Vista previa del reporte" })).toContainText("Restaurante de prueba");
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printRequested = "true"; }; });
  await page.getByRole("button", { name: "Guardar como PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-requested", "true");
  if (info.project.name === "escritorio") {
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("banner")).toHaveCount(0);
    const document = await page.pdf({ path: info.outputPath("crea-reporte-prueba.pdf"), preferCSSPageSize: true, printBackground: true });
    expect(document.subarray(0, 4).toString()).toBe("%PDF");
    await page.emulateMedia({ media: "screen" });
  }

  await page.getByRole("link", { name: "Crea IA", exact: true }).click();
  await page.getByRole("button", { name: "¿Cuál es la diferencia entre RER y RMT?" }).click();
  await expect(page.getByRole("heading", { name: "¿Cuál es la diferencia entre RER y RMT?" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Volver a mi diagnóstico", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("resultados pendientes, comparador, guías y recorrido de teclado", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  await basicAnswers(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillOrigins(page);
  await page.getByLabel("Ventas anuales", { exact: true }).fill("54000");
  await page.getByLabel("Ingresos brutos anuales").fill("54000");
  await page.getByLabel("Ventas del mes más alto").fill("4500");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByText("Información insuficiente", { exact: true })).toHaveCount(3, { timeout: 15000 });
  await page.getByRole("link", { name: "Completar compras brutas anuales" }).click();
  await expect(page.getByRole("heading", { name: "Cambiar compras brutas anuales" })).toBeFocused();
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveCount(0);
  await page.getByLabel("Compras brutas anuales").fill("25000");
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await expect(page.getByRole("heading", { name: "Tu diagnóstico" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Completar compras del mes más alto" })).toBeVisible();
  await page.goto("/comparar");
  await expect(page.getByRole("heading", { name: "Compara los regímenes" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Condiciones de NRUS y RER" })).toBeVisible();
  await page.getByLabel("Primer régimen").selectOption("RMT");
  await page.getByLabel("Segundo régimen").selectOption("RG");
  await expect(page.getByRole("table", { name: "Condiciones de RMT y RG" })).toBeVisible();
  await accessibility(page);
  await noOverflow(page);
  await page.goto("/negocios?seccion=orientacion");
  const guideSearch = page.getByRole("combobox", { name: "Buscar en las guías" });
  await guideSearch.fill("zzznoguia");
  await expect(page.getByText("No encontramos guías con esa búsqueda.")).toBeVisible();
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(guideSearch).toHaveValue("");
  await guideSearch.fill("ficha ruc");
  const suggestions = page.getByRole("listbox", { name: "Buscar en las guías" });
  await expect(suggestions).toBeVisible();
  await noOverflow(page);
  await accessibility(page);
  await guideSearch.press("Escape");
  await expect(guideSearch).toBeFocused();
  await expect(guideSearch).toHaveValue("ficha ruc");
  await expect(guideSearch).toHaveAttribute("aria-expanded", "false");
  await guideSearch.press("ArrowDown");
  const procedureOption = suggestions.getByRole("option", { name: /^Ficha RUC, actividad/ });
  await procedureOption.click();
  await expect(page.locator("#guia-ruc")).toHaveAttribute("open", "");
  await expect(page.locator("#guia-ruc summary")).toBeFocused();
  await guideSearch.fill("Mantener actualizada la Ficha RUC del restaurante");
  const articleOption = page.getByRole("option", { name: /Mantener actualizada la Ficha RUC/ });
  await expect(articleOption).toBeVisible();
  await expect(guideSearch).toHaveAttribute("aria-activedescendant", (await articleOption.getAttribute("id"))!);
  await guideSearch.press("Enter");
  await expect(page).toHaveURL(/\/requisitos\/ficha-ruc(?:[?#].*)?$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Qué preparar" })).toBeVisible();

  await page.goto("/");
  const menu = page.getByRole("button", { name: "Abrir menú" });
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Consultar obligaciones" })).toBeVisible();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  }
});

test("recupera respuestas y el paso al volver a la evaluación", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  await basicAnswers(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillOrigins(page);
  await page.getByLabel("Ventas anuales", { exact: true }).fill("34000");
  await page.getByRole("link", { name: "Pausar evaluación" }).click();
  await page.getByRole("link", { name: "Continuar mi evaluación" }).click();
  await expect(page.getByRole("heading", { name: "Ventas y compras" })).toBeVisible();
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveValue("34000");
  await page.reload();
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveValue("34000");
  await page.getByRole("button", { name: "Atrás" }).click();
  await expect(page.getByLabel("¿En qué régimen estás inscrito?")).toHaveValue("NRUS");
});

test("obligaciones públicas y consulta voluntaria del vencimiento", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Consultas directas" }).getByRole("link", { name: "Comparar regímenes" }).click();
  await expect(page.getByRole("heading", { name: "Compara los regímenes" })).toBeVisible();
  await page.goBack();
  await page.getByRole("navigation", { name: "Consultas directas" }).getByRole("link", { name: "Consultar obligaciones" }).click();
  await expect(page.getByRole("heading", { name: "Consulta tus obligaciones" })).toBeVisible();
  await page.getByLabel("Régimen a consultar").selectOption("NRUS");
  await expect(page.getByRole("heading", { name: /Obligaciones del Nuevo RUS/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pago mensual de cuota del Nuevo RUS" })).toBeVisible();
  await expect(page.getByLabel("Último dígito del RUC")).toBeHidden();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByText("Consultar vencimiento", { exact: true }).click();
  await page.getByLabel("Periodo tributario").selectOption("2026-03");
  await page.getByLabel("Último dígito del RUC").selectOption("2");
  await expect(page.getByRole("status")).toHaveText("21 de abril de 2026");
  await accessibility(page);
  await noOverflow(page);
});

test("régimen desconocido, preguntas condicionales y resultado incompatible", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  await basicAnswers(page, "DESCONOCIDO");
  await page.getByRole("radio", { name: /Como empresa/ }).check();
  await expect(page.getByRole("group", { name: "¿Emites o necesitas emitir facturas de venta?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillOrigins(page);
  await expect(page.getByLabel("Ventas del mes más alto")).toHaveCount(0);
  await page.getByLabel("Ventas anuales", { exact: true }).fill("9350001");
  await expect(page.getByLabel("Compras anuales", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Revisa tus datos" })).toBeVisible();
  await page.getByRole("button", { name: "Cambiar ventas del año" }).click();
  await page.getByLabel("Ventas anuales", { exact: true }).fill("55000");
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await expect(page.getByRole("heading", { name: "Datos relacionados con el cambio" })).toBeVisible();
  await expect(page.getByLabel("Compras anuales", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Valor de los equipos y muebles del negocio")).toBeVisible();
  await expect(page.getByLabel("Número de locales o unidades de operación")).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByRole("heading", { name: "Régimen por confirmar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Revisar opciones evaluadas" })).toBeVisible();
  await page.getByRole("link", { name: "Indicar mi régimen" }).click();
  await page.getByLabel("¿En qué régimen estás inscrito?").selectOption("NRUS");
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await page.getByRole("link", { name: "Ver alternativas" }).click();
  await expect(page).toHaveURL(/#alternativas$/);
  await expect(page.getByRole("heading", { name: "Alternativas evaluadas" })).toBeVisible();
  await expect(page.getByText(/El Nuevo RUS no admite personas jurídicas/).first()).toBeVisible();
});

test("demostración explícita y secciones protegidas", async ({ page }) => {
  await page.goto("/ingresar");
  await expect(page.getByRole("heading", { name: "Modo demostración" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Disponible con una cuenta real" })).toBeVisible();
  await page.goto("/investigacion");
  await expect(page.getByText(/36 restaurantes en un solo grupo/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Disponible con una cuenta real" })).toBeVisible();
});
