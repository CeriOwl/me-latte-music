import { AddForm } from "@/components/add-form";
import { getSnapshot } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const { upcoming, now } = await getSnapshot();
  return <AddForm queueCount={upcoming.length + (now ? 1 : 0)} />;
}
