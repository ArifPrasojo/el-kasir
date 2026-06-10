// Simple in-process event emitter for real-time updates
// In production with multiple instances, use Redis Pub/Sub instead

type EventHandler = (data: unknown) => void

class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((handler) => {
      try { handler(data) } catch (e) { console.error("Event handler error:", e) }
    })
  }
}

export const events = new EventEmitter()

// Event types
export const EVENT_TYPES = {
  TRANSACTION_CREATED: "transaction:created",
  STOCK_UPDATED: "stock:updated",
  LOW_STOCK_ALERT: "stock:low",
  SHIFT_OPENED: "shift:opened",
  SHIFT_CLOSED: "shift:closed",
} as const
