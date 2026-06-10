import { prisma } from "./prisma"
import { getClientIP } from "./rate-limit"

interface AuditParams {
  userId?: string
  action: string        // e.g. "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
  entity: string        // e.g. "Product", "User", "Transaction"
  entityId?: string
  details?: string
  request?: Request
}

export async function auditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details || "",
        ipAddress: params.request ? getClientIP(params.request) : "",
      },
    })
  } catch (error) {
    console.error("Audit log failed:", error)
  }
}
