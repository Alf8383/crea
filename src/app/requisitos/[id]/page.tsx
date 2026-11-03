import { RequirementDetail } from "@/components/requirement-detail";
import { requirements } from "@/lib/seed-catalog";

export function generateStaticParams() {
  return requirements.map((r) => ({ id: r.id }));
}

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequirementDetail id={id} />;
}
