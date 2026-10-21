import { redirect } from "next/navigation";
import { StaffPanel } from "@/components/staff-panel";
import { getSnapshot } from "@/lib/queue";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  if (!(await requireAdmin())) redirect("/staff/login");
  return <StaffPanel initial={await getSnapshot()} />;
}
