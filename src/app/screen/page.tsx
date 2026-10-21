import QRCode from "qrcode";
import { ScreenView } from "@/components/screen-view";
import { getSnapshot } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function ScreenPage() {
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  const qrSvg = await QRCode.toString(`${base}/add`, {
    type: "svg",
    margin: 0,
    color: { dark: "#3e0a14", light: "#f6eee2" },
  });
  return <ScreenView initial={await getSnapshot()} qrSvg={qrSvg} />;
}
