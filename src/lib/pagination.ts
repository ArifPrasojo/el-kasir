interface PaginationParams {
  page?: number
  limit?: number
}

interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function getPaginationParams(params: URLSearchParams): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(params.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "20")))
  const skip = (page - 1) * limit
  return { skip, take: limit, page, limit }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit)
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
