import { NextResponse } from "next/server";
import { RuleEngine } from "@/lib/rule-engine";
import { rules, sources } from "@/lib/seed-catalog";
import type { BusinessContext } from "@/lib/types";

export async function POST(request: Request) {
  const context = await request.json() as BusinessContext;
  const diagnosticDate = new Date().toISOString().slice(0, 10);
  const source=sources.find(item=>item.id==="sunat-regimes");
  const verification=source?.status==="VIGENTE" && source.nextReviewAt>=diagnosticDate?"VIGENTE":"POR_VERIFICAR";
  return NextResponse.json({ results: RuleEngine.evaluate(context, rules, sources, diagnosticDate), taxRecommendations: RuleEngine.recommendTax(context,"sunat-regimes",verification), evaluatedAt: diagnosticDate });
}
