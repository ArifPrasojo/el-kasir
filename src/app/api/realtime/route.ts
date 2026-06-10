import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { events } from "@/lib/events"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        try {
          const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        } catch {
          // Stream closed
        }
      }

      // Send initial connection event
      sendEvent("connected", { timestamp: new Date().toISOString() })

      // Subscribe to events
      const unsubs = [
        events.on("transaction:created", (data) => sendEvent("transaction:created", data)),
        events.on("stock:updated", (data) => sendEvent("stock:updated", data)),
        events.on("stock:low", (data) => sendEvent("stock:low", data)),
      ]

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        sendEvent("heartbeat", { timestamp: Date.now() })
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unsubs.forEach((unsub) => unsub())
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
