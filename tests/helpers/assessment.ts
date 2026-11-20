import { type Page } from "@playwright/test";

export async function choose(page: Page, question: string | RegExp, answer: string) {
  await page.getByRole("group", { name: question }).getByRole("radio", { name: answer, exact: true }).check();
}

export async function fillProfile(page: Page, stage = "Mi negocio ya está formalizado", regime = "NRUS") {
  await page.getByRole("radio", { name: stage, exact: false }).check();
  await page.getByLabel("Describe lo que ofrece tu negocio").fill("Restaurante de menú con delivery");
  await page.getByRole("radio", { name: "Sirvo comidas listas para consumir", exact: true }).check();
  await page.getByRole("checkbox", { name: "Confirmo este código como actividad principal" }).check();
  await page.getByRole("radio", { name: /Atención en un local/ }).check();
  await page.getByRole("radio", { name: /A mi nombre/ }).check();
  await choose(page, /Quiénes serán tus clientes/, "Personas");
  await choose(page, /Emites o necesitas emitir facturas/, "No");
  if (stage === "Mi negocio ya está formalizado") {
    await choose(page, /inscrito en el RUC/, "Sí");
    await page.getByLabel("¿En qué régimen estás inscrito?").selectOption(regime);
  } else if (stage.includes("necesito formalizarlo")) {
    await choose(page, /inscrito en el RUC/, "No");
  }
}

export async function fillOrigins(page: Page, sales = "Datos reales del ejercicio", purchases = "Datos reales del ejercicio") {
  await choose(page, /cifras de ventas/, sales);
  await choose(page, /cifras de compras/, purchases);
}
