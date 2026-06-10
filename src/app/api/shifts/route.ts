import { NextResponse } from "next/server"

// Fitur shift telah dihapus dari aplikasi
export async function GET() {
  return NextResponse.json({ error: "Fitur shift telah dihapus" }, { status: 410 })
}
export async function POST() {
  return NextResponse.json({ error: "Fitur shift telah dihapus" }, { status: 410 })
}
export async function PUT() {
  return NextResponse.json({ error: "Fitur shift telah dihapus" }, { status: 410 })
}
