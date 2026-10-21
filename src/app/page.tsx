import { NowPlayingView } from "@/components/now-playing-view";
import { getSnapshot } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <NowPlayingView initial={await getSnapshot()} />;
}
