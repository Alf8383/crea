import { RequirementDetail } from "@/components/requirement-detail";
export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RequirementDetail id={id} />; }
