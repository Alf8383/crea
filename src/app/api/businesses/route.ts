import { NextResponse } from "next/server";
import type { BusinessContext } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const context = (await request.json()) as BusinessContext;
    const generatedId = "biz_" + Date.now().toString(36);
    return NextResponse.json({ id: generatedId, name: context.businessName || "Negocio" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar solicitud" },
      { status: 400 }
    );
  }
}
