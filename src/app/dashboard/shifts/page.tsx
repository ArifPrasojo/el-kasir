"use client"

import { useEffect, useState } from "react"
import { Clock, Play, Square, DollarSign, Sun, Moon, Info } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Shift {
  id: string; openedAt: string; closedAt: string | null; openingBalance: number; closingBalance: number | null
  totalSales: number; notes: string; status: string; shiftType: string
  user: { name: string }; branch: { name: string } | null; _count: { transactions: number }
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [openShift, setOpenShift] = useState<Shift | null>(null)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [shiftType, setShiftType] = useState("PAGI")
  const [openingBalance, setOpeningBalance] = useState("")
  const [closingBalance, setClosingBalance] = useState("")
  const [closeNotes, setCloseNotes] = useState("")

  const fc = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchShifts = async () => {
    try {
      const [allShifts, current] = await Promise.all([
        apiFetch<Shift[]>("/api/shifts"),
        fetch("/api/shifts", { method: "PUT" }).then((r) => r.ok ? r.json() : null).catch(() => null),
      ])
      setShifts(allShifts)
      setOpenShift(current)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchShifts() }, [])

  const handleOpenShift = async () => {
    await fetch("/api/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open", openingBalance: parseFloat(openingBalance) || 0, shiftType }),
    })
    setShowOpenModal(false); setOpeningBalance(""); fetchShifts()
  }

  const handleCloseShift = async () => {
    await fetch("/api/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", closingBalance: parseFloat(closingBalance) || 0, notes: closeNotes }),
    })
    setShowCloseModal(false); setClosingBalance(""); setCloseNotes(""); fetchShifts()
  }

  const shiftTypeBadge = (type: string) => {
    if (type === "PAGI") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700"><Sun className="w-3 h-3" /> Pagi</span>
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"><Moon className="w-3 h-3" /> Malam</span>
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Shift Kasir</h1>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Cara Kerja Shift Kasir</p>
          <p><strong>Shift Pagi</strong> (06:00-18:00) dan <strong>Shift Malam</strong> (18:00-06:00). Setiap kasir wajib <strong>buka shift</strong> sebelum mulai bertransaksi. Saat <strong>tutup shift</strong>, sistem menghitung otomatis total penjualan dan membandingkan dengan uang di laci.</p>
          <p className="mt-1"><strong>Flow:</strong> Buka Shift (input saldo awal) → Bertransaksi → Tutup Shift (input uang aktual) → Laporan Selisih</p>
        </div>
      </div>

      {/* Current Shift Status */}
      {openShift ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full"><Clock className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="font-semibold text-green-800">Shift Sedang Aktif</p>
                <p className="text-sm text-green-600">Dibuka: {new Date(openShift.openedAt).toLocaleString("id-ID")}</p>
              </div>
            </div>
            {shiftTypeBadge(openShift.shiftType)}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-600 text-xs">Saldo Awal</p>
              <p className="font-bold text-green-800">{fc(openShift.openingBalance)}</p>
            </div>
            <div>
              <p className="text-green-600 text-xs">Transaksi</p>
              <p className="font-bold text-green-800">{openShift._count?.transactions || 0}</p>
            </div>
            <div>
              <p className="text-green-600 text-xs">Total Penjualan</p>
              <p className="font-bold text-green-800">{fc(openShift.totalSales)}</p>
            </div>
          </div>
          <button onClick={() => setShowCloseModal(true)} className="mt-4 w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2">
            <Square className="w-4 h-4" /> Tutup Shift Ini
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-1 font-medium">Belum Ada Shift Aktif</p>
          <p className="text-sm text-gray-400 mb-4">Buka shift terlebih dahulu sebelum bertransaksi</p>
          <button onClick={() => setShowOpenModal(true)} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium inline-flex items-center gap-2">
            <Play className="w-4 h-4" /> Buka Shift Baru
          </button>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Buka Shift Baru</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tipe Shift</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShiftType("PAGI")}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${shiftType === "PAGI" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Sun className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                  <p className="font-medium text-sm">Shift Pagi</p>
                  <p className="text-xs text-gray-500">06:00 - 18:00</p>
                </button>
                <button type="button" onClick={() => setShiftType("MALAM")}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${shiftType === "MALAM" ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Moon className="w-6 h-6 mx-auto mb-1 text-indigo-500" />
                  <p className="font-medium text-sm">Shift Malam</p>
                  <p className="text-xs text-gray-500">18:00 - 06:00</p>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal (Uang di Laci Kasir)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <input type="number" min="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full border rounded-lg pl-11 pr-4 py-2 focus:ring-2 focus:ring-green-500 outline-none" placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleOpenShift} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Buka Shift</button>
              <button onClick={() => setShowOpenModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Tutup Shift</h2>
            {openShift && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Saldo Awal</span><span>{fc(openShift.openingBalance)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Penjualan</span><span className="font-semibold text-green-600">+ {fc(openShift.totalSales)}</span></div>
                <div className="flex justify-between border-t pt-1"><span className="font-medium">Seharusnya di Laci</span><span className="font-bold">{fc(openShift.openingBalance + openShift.totalSales)}</span></div>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Uang Aktual di Laci</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <input type="number" min="0" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)}
                  className="w-full border rounded-lg pl-11 pr-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" placeholder="Hitung uang di laci" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-sm" rows={2} placeholder="Contoh: Semua sesuai, tidak ada selisih" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleCloseShift} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">Tutup Shift</button>
              <button onClick={() => setShowCloseModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Shift History */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800">Riwayat Shift</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kasir</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dibuka</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Saldo Awal</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Penjualan</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Saldo Akhir</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trx</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shifts.map((s) => {
                const expected = s.openingBalance + s.totalSales
                const diff = s.closingBalance !== null ? s.closingBalance - expected : 0
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm">{s.user.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-center">{shiftTypeBadge(s.shiftType)}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-gray-600">{new Date(s.openedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-right">{fc(s.openingBalance)}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-right font-semibold text-green-600">{fc(s.totalSales)}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-right">
                      {s.closingBalance !== null ? (
                        <span className={diff === 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {fc(s.closingBalance)}
                          {diff !== 0 && <span className="text-xs ml-1">({diff > 0 ? "+" : ""}{fc(diff)})</span>}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-center text-sm">{s._count?.transactions || 0}</td>
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {s.status === "OPEN" ? "Aktif" : "Selesai"}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {shifts.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Belum ada riwayat shift</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
