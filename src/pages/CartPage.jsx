import { useCart } from "../cart/CartContext.jsx";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQty, totalNetto } = useCart();

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Koszyk</h1>
          {items.length > 0 && (
            <span className="ml-auto text-sm text-neutral-400">
              {items.length} {items.length === 1 ? "pozycja" : "pozycje"}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-400 mb-6">Koszyk jest pusty</p>
            <Link
              to="/studio/?tab=3dprint"
              className="px-6 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition-colors"
            >
              Skonfiguruj wydruk 3D
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.cartItemId} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.stlFilename || "Druk 3D"}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.material} · {item.color}</p>
                    {item.stlDims && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.stlDims.x}×{item.stlDims.y}×{item.stlDims.z} mm · {item.fillPercent}% wypełnienie
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.cartItemId, (item.qty || 1) - 1)}
                      className="w-7 h-7 rounded-lg border border-white/10 text-neutral-400 hover:border-white/20 flex items-center justify-center text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm text-white w-8 text-center">{item.qty || 1}</span>
                    <button
                      onClick={() => updateQty(item.cartItemId, (item.qty || 1) + 1)}
                      className="w-7 h-7 rounded-lg border border-white/10 text-neutral-400 hover:border-white/20 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {((item.unitPriceNetto || 0) * (item.qty || 1)).toFixed(2)} {item.currency || "PLN"}
                    </p>
                    <p className="text-xs text-neutral-500">netto / szt.</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-4 mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-400">Razem netto:</span>
                <span className="text-white font-semibold">{totalNetto.toFixed(2)} PLN</span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Do kwoty zostanie doliczony VAT oraz koszty wysyłki w następnym kroku.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mt-4">
              <Link
                to="/toolstudio/print-settings/"
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-neutral-400 text-sm hover:border-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dodaj więcej
              </Link>
              <button className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition-colors">
                Przejdź do zamówienia →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
