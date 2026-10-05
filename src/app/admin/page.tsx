import { AdminConsole } from "@/components/admin-console";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) return <AdminConsole />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["ADMINISTRADOR", "SUPER_ADMIN"].includes(profile.role)) redirect("/negocios");
  return <AdminConsole />;
}
