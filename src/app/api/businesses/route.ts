import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { BusinessContext } from "@/lib/types";

export async function POST(request: Request) {
  const context = await request.json() as BusinessContext;
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ mode: "demo" });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("businesses").insert({ owner_id: user.id, name: context.businessName, purpose: context.purpose, department: context.department, province: context.province, district: context.district }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
