import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
        <CheckCircle className="w-20 h-20 text-amber-400 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-white mb-3">
          Dziękujemy za zamówienie!
        </h1>

        {orderNumber && (
          <p className="text-lg text-neutral-300 mb-6">
            Numer zamówienia:{" "}
            <span className="font-bold text-amber-400">#{orderNumber}</span>
          </p>
        )}

        <p className="text-sm text-neutral-400 mb-10 leading-relaxed">
          Potwierdzenie zostanie wysłane na Twój adres e-mail. Skontaktujemy się
          w ciągu 24 godzin roboczych, aby potwierdzić szczegóły i ustalić
          płatność.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl border border-white/10 text-neutral-300 text-sm font-medium hover:border-white/20 hover:text-white transition-colors"
          >
            Wróć do strony głównej
          </Link>
          <Link
            to="/studio/"
            className="px-6 py-3 rounded-xl bg-amber-400 text-black text-sm font-bold hover:bg-amber-300 transition-colors"
          >
            AEJaCA sTuDiO
          </Link>
        </div>
      </div>
    </div>
  );
}
