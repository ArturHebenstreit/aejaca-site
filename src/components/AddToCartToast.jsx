import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, X } from "lucide-react";

export default function AddToCartToast({ item, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-80 rounded-2xl border border-amber-400/20 bg-neutral-900 [data-theme='light']_bg-white shadow-2xl shadow-black/40 p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-amber-400">
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm font-semibold">Dodano do koszyka</span>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Item preview */}
      <p className="text-xs text-neutral-400 mb-4 truncate">
        {item?.stlFilename || "Druk 3D"} · {item?.material} · {item?.color}
      </p>
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { navigate("/cart"); onClose(); }}
          className="flex-1 py-2 rounded-xl bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 transition-colors"
        >
          Przejdź do koszyka →
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-white/10 text-neutral-400 text-xs hover:border-white/20 hover:text-white transition-colors"
        >
          Kontynuuj przeglądanie
        </button>
      </div>
    </div>
  );
}
