"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, ChevronDown } from "lucide-react"

interface Product {
  id: string; name: string; price: number; stock: number; category: { id: string; name: string }
}
interface Category { id: string; name: string }
interface CartItem { product: Product; quantity: number }
interface ReceiptData {
  transactionNumber: string; totalAmount: number; paymentAmount: number;
  changeAmount: number; items: CartItem[]; createdAt: string; userName: string
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDisplay, setPaymentDisplay] = useState("")

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "")
    if (raw === "") {
      setPaymentAmount("")
      setPaymentDisplay("")
    } else {
      const num = parseInt(raw)
      setPaymentAmount(num.toString())
      setPaymentDisplay(new Intl.NumberFormat("id-ID").format(num))
    }
  }
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const fetchProducts = async () => {
    const res = await fetch(`/api/products?search=${search}&categoryId=${filterCategory}&activeOnly=true`)
    setProducts(await res.json())
  }

  useEffect(() => { fetchProducts() }, [search, filterCategory])

  useEffect(() => {
    fetch("/api/categories").then((res) => res.json()).then(setCategories)
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        if (newQty > item.product.stock) return item
        return { ...item, quantity: newQty }
      }).filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const changeAmount = parseFloat(paymentAmount || "0") - totalAmount

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (parseFloat(paymentAmount || "0") < totalAmount) return

    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          totalAmount,
          paymentAmount: parseFloat(paymentAmount || "0"),
          changeAmount: Math.max(0, changeAmount),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setReceiptData({
          transactionNumber: data.transactionNumber,
          totalAmount: data.totalAmount,
          paymentAmount: data.paymentAmount,
          changeAmount: data.changeAmount,
          items: cart,
          createdAt: data.createdAt,
          userName: data.user?.name || "",
        })
        setShowReceipt(true)
        setCart([])
        setPaymentAmount("")
        setPaymentDisplay("")
        fetchProducts()
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 lg:mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="">Semua</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 content-start pb-20 lg:pb-0">
          {products.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border text-left hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">{product.name}</p>
              <p className="text-xs text-gray-500 mb-1 sm:mb-2">{product.category.name}</p>
              <p className="font-bold text-blue-600 text-xs sm:text-base">{formatCurrency(product.price)}</p>
              <p className={`text-xs mt-1 ${product.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                Stok: {product.stock}
              </p>
            </button>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-12">Tidak ada produk ditemukan</div>
          )}
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-4 right-4 z-10 bg-blue-600 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 active:scale-95 transition-transform"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-semibold">{cart.length}</span>
        {totalAmount > 0 && (
          <span className="text-xs border-l border-white/30 pl-2">{formatCurrency(totalAmount)}</span>
        )}
      </button>

      {/* Right Panel - Cart (Desktop: sidebar, Mobile: overlay) */}
      <div className={`
        fixed inset-0 z-40 lg:static lg:z-auto
        ${showCart ? "block" : "hidden"} lg:block
      `}>
        {/* Mobile overlay backdrop */}
        <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={() => setShowCart(false)} />

        <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm lg:static lg:w-96 bg-white lg:rounded-xl shadow-lg lg:shadow-sm lg:border flex flex-col z-50">
          <div className="p-4 border-b flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Keranjang</h2>
            <span className="text-sm text-gray-500">({cart.length} item)</span>
            <button onClick={() => setShowCart(false)} className="ml-auto lg:hidden p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} x {item.quantity}</p>
              </div>
              <p className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatCurrency(item.product.price * item.quantity)}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.product.id, -1)}
                  className="p-1 bg-white border rounded hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                <span className="w-5 sm:w-6 text-center text-xs sm:text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)}
                  className="p-1 bg-white border rounded hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                <button onClick={() => removeFromCart(item.product.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600 text-sm sm:text-base">Total</span>
            <span className="text-lg sm:text-xl font-bold text-gray-800">{formatCurrency(totalAmount)}</span>
          </div>

          <div>
            <label className="text-sm text-gray-500">Bayar</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <input type="text" inputMode="numeric" value={paymentDisplay} onChange={handlePaymentChange}
                className="w-full border rounded-lg pl-11 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-right font-semibold text-lg"
                placeholder="0" />
            </div>
          </div>

          {parseFloat(paymentAmount || "0") >= totalAmount && totalAmount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span className="font-medium">Kembalian</span>
              <span className="text-lg font-bold">{formatCurrency(changeAmount)}</span>
            </div>
          )}

          <button onClick={handleCheckout} disabled={cart.length === 0 || parseFloat(paymentAmount || "0") < totalAmount || checkoutLoading}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
            {checkoutLoading ? "Memproses..." : "Bayar"}
          </button>
        </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white print:p-0">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm print:shadow-none print:max-w-full">
            <div ref={receiptRef} className="print:px-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">El-Kasir</h2>
                <p className="text-xs text-gray-500">Struk Pembayaran</p>
                <p className="text-xs text-gray-500">{new Date(receiptData.createdAt).toLocaleString("id-ID")}</p>
                <p className="text-xs text-gray-500">No: {receiptData.transactionNumber}</p>
                <p className="text-xs text-gray-500">Kasir: {receiptData.userName}</p>
              </div>

              <div className="border-t border-dashed py-3 space-y-2">
                {receiptData.items.map((item, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{item.product.name}</p>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.quantity} x {formatCurrency(item.product.price)}</span>
                      <span>{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-3 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total</span><span>{formatCurrency(receiptData.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bayar</span><span>{formatCurrency(receiptData.paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kembali</span><span>{formatCurrency(receiptData.changeAmount)}</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">Terima kasih atas kunjungan Anda!</p>
            </div>

            <div className="flex gap-3 mt-4 print:hidden">
              <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
