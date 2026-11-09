import { describe, expect, it } from "vitest";
import { getTaxPath, practicalGuides } from "./practical-guides";
import type { BusinessContext } from "./types";

const restaurantProfile: BusinessContext = {
  businessName: "Restaurante Cajamarquino",
  purpose: "formalizar",
  sectorId: "restaurantes",
  activityId: "restaurante",
  otherActivity: "Venta de menú y platos a la carta",
  department: "Cajamarca",
  province: "Cajamarca",
  district: "Cajamarca",
  legalPerson: "natural",
  personType: "PERSONA_NATURAL",
  hasPartners: false,
  partnerCount: 1,
  hasPhysicalLocation: true,
  servesPublic: true,
  employeeCount: 3,
  employeeCountPerShift: 3,
  employees: 3,
  sellsOnline: false,
  preparesFood: true,
  importsGoods: false,
  exportsGoods: false,
  providesRegulatedService: false,
  customerType: "personas",
  monthlyRevenue: 4000,
  annualRevenue: 48000,
  monthlyPurchases: 1500,
  annualPurchases: 18000,
  fixedAssets: 8000,
  fixedAssetsValue: 8000,
  establishmentCount: 1,
  needsInvoices: false,
  needsFacturas: false,
  hasMultipleLocations: false,
  foreignSourceIncome: false,
  collectsPersonalData: false,
};

describe("Centro de orientación y getTaxPath para restaurantes", () => {
  it("organiza las guías educativas en las 3 áreas de la investigación (OE1, OE2, OE3)", () => {
    const areas = new Set(Object.values(practicalGuides).map((g) => g.area));
    expect(areas.has("COMPRENSION")).toBe(true);
    expect(areas.has("EVALUACION")).toBe(true);
    expect(areas.has("CUMPLIMIENTO")).toBe(true);
  });

  it("solicita completar datos cuando faltan ventas, compras o activos fijos", () => {
    const result = getTaxPath({
      ...restaurantProfile,
      monthlyRevenue: undefined,
      annualRevenue: undefined,
      questionnaire: { P20: "S/ 2,500 a S/ 5,000" },
    });
    expect(result.status).toBe("FALTAN_DATOS");
  });

  it("identifica compatibilidad con RER cuando el restaurante requiere emitir facturas y cumple topes", () => {
    const result = getTaxPath({
      ...restaurantProfile,
      needsInvoices: true,
      needsFacturas: true,
      monthlyRevenue: 15000,
      annualRevenue: 180000,
    });
    expect(result.code).toBe("RER");
    expect(result.status).toBe("PRESELECCION");
  });
});
