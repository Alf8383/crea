import { describe, expect, it } from "vitest";
import { getTaxPath } from "./practical-guides";
import type { BusinessContext } from "./types";

const profile: BusinessContext = {
  businessName: "Agencia de viajes", purpose: "crear", sectorId: "turismo", activityId: "agencia", otherActivity: "Vendo y reservo viajes",
  department: "Cajamarca", province: "Cajamarca", district: "Cajamarca", legalPerson: "natural", hasPartners: false, partnerCount: 1,
  hasPhysicalLocation: false, servesPublic: true, employeeCount: 0, employeeCountPerShift: 0, sellsOnline: true, preparesFood: false,
  importsGoods: false, exportsGoods: false, providesRegulatedService: false, customerType: "personas", monthlyRevenue: 4000,
  monthlyPurchases: 1000, annualPurchases: 12000, fixedAssets: 1000, needsInvoices: false, hasMultipleLocations: false,
  foreignSourceIncome: false, collectsPersonalData: false,
};

describe("getTaxPath", () => {
  it("does not turn an income range into an automatic RMT recommendation", () => {
    const result = getTaxPath({ ...profile, questionnaire: { P20: "S/ 2,500 a S/ 5,000", TAX_PURCHASES: "1000", TAX_ASSETS: "1000", P28: "No", P22: "Personas", P23: "No, venderé a consumidores" } });
    expect(result.code).toBeUndefined();
    expect(result.status).toBe("FALTAN_DATOS");
    expect(result.checks.some(item=>item.includes("calculadora"))).toBe(true);
  });

  it("does not present RMT as the default when an agency can compare under RER limits", () => {
    const result = getTaxPath({ ...profile, questionnaire: { P20: "monto:4000", TAX_PURCHASES: "1000", TAX_ASSETS: "1000", P28: "No", P22: "Personas", P23: "No, venderé a consumidores" } });
    expect(result.code).toBe("RER");
  });
});
