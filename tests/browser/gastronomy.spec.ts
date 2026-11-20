import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { choose, fillOrigins, fillProfile } from "../helpers/assessment";

test("la nube conserva la conversación, permite cerrarla con Escape y se restringe en investigación", async ({ page }) => {
  await page.goto("/");
  const cloud = page.getByRole("button", { name: "CREA IA, asistente de orientación" });
  await expect(cloud).toBeEnabled();
  await cloud.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "CREA IA" });
  await expect(dialog.getByRole("button", { name: "Cerrar CREA IA" })).toBeFocused();
  await dialog.getByRole("button", { name: "¿Qué es el código CIIU?" }).click();
  await expect(dialog.getByText(/Es el código que identifica/)).toBeVisible();
  await expect(dialog.getByText(/Proveedor de IA sin configurar/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cloud).toBeFocused();
  await page.getByRole("link", { name: "Evaluar mi negocio", exact: true }).click();
  await cloud.click();
  await expect(dialog.getByText(/Es el código que identifica/)).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("#crea-cloud-panel").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations.map(({ id }) => id)).toEqual([]);
  await page.goto("/investigacion");
  await cloud.click();
  await expect(dialog.getByText(/La asistencia está deshabilitada/)).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
});

test("una idea puede proyectar ventas sin RUC y guardar su ruta", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  const advance = page.getByRole("button", { name: "Continuar" });
  await advance.scrollIntoViewIfNeeded();
  const actionBounds = await advance.boundingBox();
  const cloudBounds = await page.getByRole("button", { name: "CREA IA, asistente de orientación" }).boundingBox();
  expect(actionBounds).not.toBeNull();
  expect(cloudBounds).not.toBeNull();
  if (actionBounds && cloudBounds) {
    expect(actionBounds.x + actionBounds.width).toBeLessThanOrEqual(cloudBounds.x);
  }
  await fillProfile(page, "Solo tengo una idea de negocio");
  await expect(page.getByLabel("¿En qué régimen estás inscrito?")).toHaveCount(0);
  await expect(page.getByRole("group", { name: /inscrito en el RUC/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("radio", { name: "Datos reales del ejercicio" })).toHaveCount(0);
  await fillOrigins(page, "Proyección del ejercicio", "Todavía no tengo cifras");
  await page.getByText("Proyectar ventas por productos o servicios", { exact: true }).click();
  await page.getByLabel("Precio promedio").fill("10");
  await page.getByLabel("Pedidos diarios").fill("20");
  await page.getByLabel("Días al mes").fill("20");
  await page.getByRole("button", { name: "Calcular proyección" }).click();
  await page.getByRole("button", { name: "Usar proyección" }).click();
  await expect(page.getByLabel("Ingresos brutos anuales")).toHaveValue("48000.00");
  await expect(page.getByLabel("Ventas del mes más alto", { exact: true })).toHaveValue("4000.00");
  await expect(page.getByLabel("Compras anuales", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByRole("heading", { name: "Tu escenario antes de abrir" })).toBeVisible();
  await expect(page.getByText("Proyectadas", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver mi ruta de formalización" }).click();
  await page.getByRole("checkbox", { name: "Definir la forma de operar" }).check();
  await expect(page.getByText(/1 de \d+ tareas marcadas/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Definir la forma de operar" })).toBeChecked();
  await page.getByRole("link", { name: "Ejemplos" }).click();
  await page.getByRole("button", { name: /Abrir ejemplo: Cafetería en preparación/ }).click();
  await expect(page.getByText("Simulación con datos ficticios.")).toBeVisible();
  await page.getByRole("button", { name: "Salir del ejemplo" }).click();
  await expect(page.getByText(/5610.*Actividades de restaurantes/)).toBeVisible();
});

for (const stage of ["Estoy preparando mi negocio", "Mi negocio ya funciona, pero necesito formalizarlo"]) {
  test("adapta inscripción, proyección y origen para: " + stage, async ({ page }) => {
    await page.goto("/negocios/nuevo");
    await fillProfile(page, stage);
    await expect(page.getByRole("group", { name: /inscrito en el RUC/ })).toHaveCount(stage.includes("necesito formalizarlo") ? 1 : 0);
    await expect(page.getByLabel("¿En qué régimen estás inscrito?")).toHaveCount(0);
    await choose(page, /Emites o necesitas emitir facturas/, "Sí");
    await page.getByRole("button", { name: "Continuar" }).click();
    await fillOrigins(page, "Proyección del ejercicio", "Todavía no tengo cifras");
    await expect(page.getByLabel("Ingresos brutos anuales")).toHaveCount(0);
    await expect(page.getByLabel("Ventas anuales", { exact: true })).toBeVisible();
  });
}

test("los casos ficticios se abren con simulador y formalización", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Probar con un ejemplo" }).click();
  await page.getByRole("button", { name: /Abrir ejemplo: Cafetería en preparación/ }).click();
  await expect(page.getByText("Simulación con datos ficticios.")).toBeVisible();
  await expect(page.getByText(/5630.*Actividades de servicio de bebidas/)).toBeVisible();
  await page.getByRole("link", { name: "Ir al simulador" }).click();
  await expect(page.getByLabel("Ventas del mes", { exact: true })).toHaveValue("4500");
  await page.getByRole("button", { name: "Calcular estimación" }).click();
  await expect(page.getByRole("heading", { name: "Resultados del simulador" })).toBeVisible();
  await expect(page.getByText("Saldo estimado antes de impuestos")).toBeVisible();
});
