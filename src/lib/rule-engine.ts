import type { AppliedRequirement, BusinessContext, Condition, ConditionGroup, Rule, Source, TaxRecommendation, VerificationStatus } from "./types";

const UIT_2026 = 5500;
const RMT_INCOME_LIMIT_2026 = 1700 * UIT_2026;

const isGroup = (item: Condition | ConditionGroup): item is ConditionGroup => "conditions" in item;
const compare = (actual: unknown, condition: Condition) => {
  const expected = condition.value;
  switch (condition.operator) {
    case "=": return actual === expected; case "!=": return actual !== expected; case ">": return Number(actual) > Number(expected); case ">=": return Number(actual) >= Number(expected); case "<": return Number(actual) < Number(expected); case "<=": return Number(actual) <= Number(expected);
    case "IN": return Array.isArray(expected) && expected.includes(actual); case "NOT_IN": return Array.isArray(expected) && !expected.includes(actual); case "CONTAINS": return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected)); case "IS_TRUE": return actual === true; case "IS_FALSE": return actual === false;
  }
};
export function evaluateGroup(context: BusinessContext, group: ConditionGroup): boolean { const values = group.conditions.map((item) => isGroup(item) ? evaluateGroup(context, item) : compare(context[item.field], item)); return group.connector === "AND" ? values.every(Boolean) : values.some(Boolean); }
const health = (rule: Rule, source: Source | undefined, date: string): VerificationStatus => !source || source.status !== "VIGENTE" || rule.nextReviewAt < date || source.nextReviewAt < date || (!!rule.effectiveTo && rule.effectiveTo < date) || rule.effectiveFrom > date ? "POR_VERIFICAR" : "VIGENTE";

export class RuleEngine {
  static evaluate(context: BusinessContext, rules: Rule[], sources: Source[], diagnosticDate = new Date().toISOString().slice(0,10)): AppliedRequirement[] {
    const picked = new Map<string, AppliedRequirement>();
    rules.filter((rule) => rule.status === "PUBLICADA" && evaluateGroup(context, rule.conditions)).sort((a,b) => b.priority-a.priority).forEach((rule) => {
      const source = sources.find((item) => item.id === rule.sourceId); const verification = health(rule, source, diagnosticDate);
      rule.actions.forEach((action) => { if (!picked.has(action.requirementId)) picked.set(action.requirementId, { requirementId:action.requirementId, classification:action.classification, reason:action.reason, ruleId:rule.id, ruleVersion:rule.version, sourceId:rule.sourceId, priority:rule.priority, verification, lastVerifiedAt:rule.lastVerifiedAt, nextReviewAt:rule.nextReviewAt }); });
    });
    return [...picked.values()];
  }
  static recommendTax(context: BusinessContext, sourceId = "sunat-regimes", verification: VerificationStatus = "VIGENTE"): TaxRecommendation[] {
    const answers=context.questionnaire;
    const has=(key:string)=>!answers || Boolean(String(answers[key]||"").trim());
    const exactSales=!answers || String(answers.P20||"").startsWith("monto:");
    const activityKnown=Boolean(context.activityId);
    const annualIncome=context.monthlyRevenue*12;
    const annualPurchases=context.monthlyPurchases*12;
    const result=(code:TaxRecommendation["code"],title:string,failures:string[],missing:string[],success:string[]):TaxRecommendation=>{
      const status=verification!=="VIGENTE"?"INFORMACION_INSUFICIENTE":failures.length?"INCOMPATIBLE":missing.length?"INFORMACION_INSUFICIENTE":"COMPATIBLE";
      const explanation=failures.length?failures:missing.length?missing:success;
      return {code,title,compatible:status==="COMPATIBLE",status,reasons:verification!=="VIGENTE"?["La fuente tributaria está pendiente de verificación formal. Consulta SUNAT antes de decidir.",...explanation]:explanation,sourceId,verification};
    };
    const basics:string[]=[];
    if(context.legalPerson==="aun-no-se")basics.push("Indica si operarás como persona natural o jurídica.");
    if(!context.otherActivity.trim()&&!context.activityId)basics.push("Describe la actividad económica.");
    const incomeMissing=exactSales?[]:["Indica una estimación mensual concreta: el rango por sí solo no permite evaluar todos los límites."];
    const nrusFailures:string[]=[];
    const nrusMissing=[...basics,...incomeMissing];
    if(context.legalPerson==="juridica")nrusFailures.push("El Nuevo RUS no comprende personas jurídicas.");
    if(context.customerType==="empresas"||context.customerType==="ambos")nrusFailures.push("Tus clientes incluyen empresas; el Nuevo RUS se orienta a consumidores finales.");
    if(context.customerType==="aun-no-se")nrusMissing.push("Indica a quiénes venderás.");
    if(context.needsInvoices===true)nrusFailures.push("Tus clientes podrían pedir factura, que no corresponde a la operativa ordinaria del Nuevo RUS.");
    if(context.needsInvoices===null)nrusMissing.push("Aclara si necesitarás emitir facturas.");
    if(exactSales&&(context.monthlyRevenue>8000||annualIncome>96000))nrusFailures.push("Tus ventas estimadas superan el límite general del Nuevo RUS.");
    if(has("TAX_PURCHASES")&&(context.monthlyPurchases>8000||annualPurchases>96000))nrusFailures.push("Tus compras estimadas superan el límite general del Nuevo RUS.");
    if(!has("TAX_PURCHASES"))nrusMissing.push("Indica las compras mensuales aproximadas.");
    if(has("TAX_ASSETS")&&context.fixedAssets>70000)nrusFailures.push("Los activos declarados superan el límite general considerado.");
    if(!has("TAX_ASSETS"))nrusMissing.push("Indica los activos fijos aproximados.");
    if(context.hasMultipleLocations)nrusFailures.push("Declaraste más de una unidad de explotación.");
    if(!activityKnown)nrusMissing.push("La actividad aún necesita clasificación para comprobar exclusiones del régimen.");
    if(["carga","agencia"].includes(context.activityId))nrusFailures.push("La actividad seleccionada requiere revisión por una exclusión del Nuevo RUS.");
    if(context.sectorId==="turismo"&&["agencia","operador-turistico"].includes(context.activityId)&&!nrusFailures.length)nrusMissing.push("Confirma con SUNAT si la actividad turística exacta está excluida del Nuevo RUS.");
    const rerFailures:string[]=[];
    const rerMissing=[...basics,...incomeMissing];
    if(exactSales&&annualIncome>525000)rerFailures.push("Las ventas anuales estimadas superan S/ 525,000.");
    if(has("TAX_PURCHASES")&&annualPurchases>525000)rerFailures.push("Las compras anuales estimadas superan S/ 525,000.");
    if(!has("TAX_PURCHASES"))rerMissing.push("Indica las compras mensuales aproximadas.");
    if(has("TAX_ASSETS")&&context.fixedAssets>126000)rerFailures.push("Los activos fijos estimados superan S/ 126,000.");
    if(!has("TAX_ASSETS"))rerMissing.push("Indica los activos fijos aproximados.");
    if(context.employeeCountPerShift>10)rerFailures.push("Declaraste más de diez trabajadores por turno.");
    if(answers?.P28==="Sí"&&!has("P29.1"))rerMissing.push("Indica cuántos trabajadores coincidirían por turno.");
    if(!activityKnown)rerMissing.push("La actividad necesita clasificación para comprobar exclusiones del RER.");
    if(["contratista","carga"].includes(context.activityId))rerFailures.push("La actividad declarada aparece entre las restricciones generales del RER.");
    if(context.sectorId==="turismo"&&!activityKnown)rerMissing.push("Confirma el CIIU exacto y revisa las exclusiones aplicables a esa actividad.");
    const rmtFailures=exactSales&&annualIncome>RMT_INCOME_LIMIT_2026?["Las ventas estimadas superan 1,700 UIT con el valor de UIT de 2026."]:[];
    const rmtMissing=[...basics,...incomeMissing];
    if(!activityKnown)rmtMissing.push("Describe la actividad para revisar posibles exclusiones o tratamientos especiales.");
    if(answers?.P01==="Educación"||answers?.P01==="Salud")rmtMissing.push("Esta actividad necesita revisar exclusiones o tratamientos particulares.");
    const rgMissing=[...basics,...incomeMissing];
    if(!activityKnown)rgMissing.push("Describe la actividad para comprobar si requiere una revisión sectorial.");
    return [
      result("NRUS","Nuevo RUS",nrusFailures,nrusMissing,["Las condiciones generales declaradas están dentro de los límites evaluados. Confirma las exclusiones de actividad."]),
      result("RER","Régimen Especial de Renta",rerFailures,rerMissing,["Las condiciones generales declaradas están dentro de los límites evaluados. Confirma las exclusiones de actividad."]),
      result("RMT","Régimen MYPE Tributario",rmtFailures,rmtMissing,["Las ventas estimadas no superan el límite general de 1,700 UIT de 2026.","Confirma que no exista vinculación empresarial que supere el límite ni sea sucursal de empresa extranjera."]),
      result("RG","Régimen General",[],rgMissing,["La comparación general de SUNAT no establece un tope de ingresos para este régimen."]),
    ];
  }
}
