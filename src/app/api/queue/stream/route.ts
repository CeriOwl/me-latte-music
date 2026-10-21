import { CHANNEL, getSnapshot } from "@/lib/queue";
import { createSubscriber } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events: the browser keeps this request open and we write a
 * line each time the queue changes. See the plan for the full flow.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const subscriber = createSubscriber();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const pushSnapshot = async () => {
        try {
          send(`data: ${JSON.stringify(await getSnapshot())}\n\n`);
        } catch (error) {
          console.error("sse snapshot failed", error);
        }
      };

      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        subscriber.quit().catch(() => {});
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener("abort", cleanup);

      subscriber.on("message", pushSnapshot);
      await subscriber.subscribe(CHANNEL);
      await pushSnapshot(); // first paint for the new client
    },
    cancel() {
      subscriber.quit().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
