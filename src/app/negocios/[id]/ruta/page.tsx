import { RouteDashboard } from "@/components/route-dashboard";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function RoutePage() {
  return <RouteDashboard />;
}
