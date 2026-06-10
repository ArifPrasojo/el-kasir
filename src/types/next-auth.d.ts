import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      branchId?: string
      branchName?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    branchId?: string
    branchName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    branchId?: string
    branchName?: string
  }
}
