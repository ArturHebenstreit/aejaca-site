import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../cart/CartContext.jsx";
import { ArrowLeft, Package, Truck, MapPin } from "lucide-react";

const API_BASE = import.meta.env.VITE_CHAT_API_URL || "https://api.aejaca.com";

const EU_COUNTRIES = [
  "PL","DE","FR","AT","BE","BG","HR","CY","CZ","DK","EE","FI","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PT","RO","SK","SI","ES","SE","NO","CH",
];

const COUNTRY_OPTIONS = [
  { value: "PL", label: "Polska" },
  { value: "DE", label: "Niemcy" },
  { value: "FR", label: "Francja" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgia" },
  { value: "BG", label: "Bułgaria" },
  { value: "HR", label: "Chorwacja" },
  { value: "CY", label: "Cypr" },
  { value: "CZ", label: "Czechy" },
  { value: "DK", label: "Dania" },
  { value: "EE", label: "Estonia" },
  { value: "FI", label: "Finlandia" },
  { value: "GR", label: "Grecja" },
  { value: "HU", label: "Węgry" },
  { value: "IE", label: "Irlandia" },
  { value: "IT", label: "Włochy" },
  { value: "LV", label: "Łotwa" },
  { value: "LT", label: "Litwa" },
  { value: "LU", label: "Luksemburg" },
  { value: "MT", label: "Malta" },
  { value: "NL", label: "Holandia" },
  { value: "PT", label: "Portugalia" },
  { value: "RO", label: "Rumunia" },
  { value: "SK", label: "Słowacja" },
  { value: "SI", label: "Słowenia" },
  { value: "ES", label: "Hiszpania" },
  { value: "SE", label: "Szwecja" },
  { value: "NO", label: "Norwegia" },
  { value: "CH", label: "Szwajcaria" },
  { value: "GB", label: "Wielka Brytania" },
  { value: "US", label: "USA" },
  { value: "OTHER", label: "Inne" },
];

const SHIPPING_OPTIONS = [
  {
    id: "inpost",
    label: "InPost Paczkomat",
    price: 14.99,
    description: "Dostawa w 1-2 dni robocze",
  },
  {
    id: "dhl",
    label: "DHL Kurier",
    price: 19.99,
    description: "Dostawa w 1 dzień roboczy",
  },
  {
    id: "personal",
    label: "Odbiór osobisty",
    price: 0,
    description: "Warszawa — do uzgodnienia",
  },
];

const SHIPPING_COSTS = { inpost: 14.99, dhl: 19.99, personal: 0 };

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  postalCode: "",
  city: "",
  country: "PL",
  vatId: "",
};

function SectionBlock({ children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-4">
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
      {children}
    </p>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (error) =>
  `w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-colors ${
    error
      ? "border-red-500 focus:ring-red-500"
      : "border-white/10 focus:border-amber-400/50 focus:ring-amber-400/30"
  }`;

export default function CheckoutPage() {
  const { items, totalNetto, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [shipping, setShipping] = useState("inpost");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const firstErrorRef = useRef(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/studio/?tab=3dprint", { replace: true });
    }
  }, [items, navigate]);

  // VAT calculation
  const vatId = form.vatId?.trim();
  const country = form.country;
  const vatRate =
    country === "PL"
      ? 0.23
      : EU_COUNTRIES.includes(country) && vatId
      ? 0
      : EU_COUNTRIES.includes(country)
      ? 0.23
      : 0;

  const shippingCost = SHIPPING_COSTS[shipping];
  const vatBase = totalNetto + shippingCost;
  const vatAmount = vatBase * vatRate;
  const totalBrutto = vatBase + vatAmount;

  const vatLabel =
    vatRate === 0 && country !== "PL" && EU_COUNTRIES.includes(country) && vatId
      ? "VAT (0% — odwrotne obciążenie)"
      : vatRate === 0 && !EU_COUNTRIES.includes(country)
      ? "VAT (0% — eksport)"
      : `VAT (${Math.round(vatRate * 100)}%)`;

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Imię i nazwisko jest wymagane";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Podaj poprawny adres e-mail";
    if (!form.phone.trim()) e.phone = "Numer telefonu jest wymagany";
    if (!form.address.trim()) e.address = "Adres jest wymagany";
    if (!form.postalCode.trim()) e.postalCode = "Kod pocztowy jest wymagany";
    else if (form.country === "PL" && !/^\d{2}-\d{3}$/.test(form.postalCode))
      e.postalCode = "Format: XX-XXX";
    if (!form.city.trim()) e.city = "Miasto jest wymagane";
    if (!form.country) e.country = "Wybierz kraj";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector("[data-error='true']");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    if (!agree1 || !agree2) {
      setSubmitError("Zaznacz wymagane zgody, aby złożyć zamówienie.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          stlFilename: i.stlFilename,
          stlDims: i.stlDims,
          stlVolumeCm3: i.stlVolumeCm3,
          material: i.material,
          segment: i.segment,
          colors: i.colors,
          colorDescriptions: i.colorDescriptions,
          infill: i.infill,
          precision: i.precision,
          colorCount: i.colorCount,
          qty: i.qty,
          unitPriceNetto: i.unitPriceNetto,
          currency: i.currency,
        })),
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company || null,
          vatId: form.vatId || null,
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
          country: form.country,
        },
        shipping: {
          method: shipping,
          cost: shippingCost,
        },
        pricing: {
          subtotalNetto: totalNetto,
          shippingCost,
          vatRate,
          vatAmount,
          totalBrutto,
          currency: "PLN",
        },
      };

      const res = await fetch(`${API_BASE}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data = await res.json();
        clearCart();
        navigate(`/order-confirmation?order=${data.orderNumber}`);
      } else {
        setSubmitError(
          "Wystąpił błąd. Spróbuj ponownie lub skontaktuj się z nami."
        );
      }
    } catch {
      setSubmitError(
        "Wystąpił błąd. Spróbuj ponownie lub skontaktuj się z nami."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/cart"
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Wróć do koszyka"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Złóż zamówienie</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Cart summary */}
          <SectionBlock>
            <SectionTitle>Twoje zamówienie</SectionTitle>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.stlFilename || "Druk 3D"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.material}
                      {item.segment ? ` (${item.segment})` : ""}
                    </p>
                    {item.colors?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.colors.map((c, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {c.hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                                style={{ background: c.hex }}
                              />
                            )}
                            <span className="text-xs text-neutral-500">{c.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-neutral-500">
                      Ilość: {item.qty || 1}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white shrink-0">
                    {((item.unitPriceNetto || 0) * (item.qty || 1)).toFixed(2)}{" "}
                    {item.currency || "PLN"}
                  </p>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Section 2: Contact details */}
          <SectionBlock>
            <SectionTitle>Dane kontaktowe</SectionTitle>
            <Field label="Imię i nazwisko *" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputCls(errors.name)}
                placeholder="Jan Kowalski"
                data-error={!!errors.name || undefined}
                autoComplete="name"
              />
            </Field>
            <Field label="Adres e-mail *" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputCls(errors.email)}
                placeholder="jan@firma.pl"
                data-error={!!errors.email || undefined}
                autoComplete="email"
              />
            </Field>
            <Field label="Telefon *" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputCls(errors.phone)}
                placeholder="+48 600 000 000"
                data-error={!!errors.phone || undefined}
                autoComplete="tel"
              />
            </Field>
            <Field label="Firma (opcjonalnie)">
              <input
                type="text"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
                className={inputCls(false)}
                placeholder="Nazwa firmy"
                autoComplete="organization"
              />
            </Field>
          </SectionBlock>

          {/* Section 3: Shipping address */}
          <SectionBlock>
            <SectionTitle>Adres dostawy</SectionTitle>
            <Field label="Ulica i numer *" error={errors.address}>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className={inputCls(errors.address)}
                placeholder="ul. Przykładowa 1/2"
                data-error={!!errors.address || undefined}
                autoComplete="street-address"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Kod pocztowy *"
                error={errors.postalCode}
                hint={form.country === "PL" ? "Format: XX-XXX" : undefined}
              >
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  className={inputCls(errors.postalCode)}
                  placeholder="00-000"
                  data-error={!!errors.postalCode || undefined}
                  autoComplete="postal-code"
                />
              </Field>
              <Field label="Miasto *" error={errors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className={inputCls(errors.city)}
                  placeholder="Warszawa"
                  data-error={!!errors.city || undefined}
                  autoComplete="address-level2"
                />
              </Field>
            </div>
            <Field label="Kraj *" error={errors.country}>
              <select
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                className={inputCls(errors.country) + " cursor-pointer"}
                data-error={!!errors.country || undefined}
                autoComplete="country"
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="NIP / VAT ID (dla firm, opcjonalnie)"
              hint="Dla firm UE z numerem VAT — stawka 0% (odwrotne obciążenie)"
            >
              <input
                type="text"
                value={form.vatId}
                onChange={(e) => setField("vatId", e.target.value)}
                className={inputCls(false)}
                placeholder="PL1234567890"
              />
            </Field>
          </SectionBlock>

          {/* Section 4: Shipping method */}
          <SectionBlock>
            <SectionTitle>Metoda dostawy</SectionTitle>
            <div className="space-y-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                    shipping === opt.id
                      ? "border-amber-400 bg-amber-400/[0.03]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={opt.id}
                    checked={shipping === opt.id}
                    onChange={() => setShipping(opt.id)}
                    className="accent-amber-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-neutral-500">{opt.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-white shrink-0">
                    {opt.price === 0 ? "0,00" : opt.price.toFixed(2).replace(".", ",")} PLN
                  </p>
                </label>
              ))}
            </div>
          </SectionBlock>

          {/* Section 5: Summary */}
          <SectionBlock>
            <SectionTitle>Podsumowanie</SectionTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Produkty netto:</span>
                <span className="text-white">
                  {totalNetto.toFixed(2).replace(".", ",")} PLN
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Dostawa:</span>
                <span className="text-white">
                  {shippingCost.toFixed(2).replace(".", ",")} PLN
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">{vatLabel}:</span>
                <span className="text-white">
                  {vatAmount.toFixed(2).replace(".", ",")} PLN
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                <span className="text-white font-semibold">Razem brutto:</span>
                <span className="text-amber-400 font-bold text-base">
                  {totalBrutto.toFixed(2).replace(".", ",")} PLN
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Faktura VAT zostanie wystawiona i przesłana na podany adres e-mail.
            </p>
          </SectionBlock>

          {/* Section 6: Consents */}
          <SectionBlock>
            <SectionTitle>Zgody</SectionTitle>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree1}
                  onChange={(e) => setAgree1(e.target.checked)}
                  className="mt-0.5 accent-amber-400 shrink-0"
                />
                <span className="text-xs text-neutral-400">
                  Zapoznałem/am się z{" "}
                  <Link
                    to="/returns/"
                    className="text-amber-400 hover:underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Regulaminem
                  </Link>{" "}
                  i akceptuję jego warunki.{" "}
                  <span className="text-red-400">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree2}
                  onChange={(e) => setAgree2(e.target.checked)}
                  className="mt-0.5 accent-amber-400 shrink-0"
                />
                <span className="text-xs text-neutral-400">
                  Wyrażam zgodę na przetwarzanie danych osobowych w celu
                  realizacji zamówienia.{" "}
                  <Link
                    to="/privacy/"
                    className="text-amber-400 hover:underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Polityka prywatności
                  </Link>{" "}
                  <span className="text-red-400">*</span>
                </span>
              </label>
            </div>
          </SectionBlock>

          {/* Submit */}
          {submitError && (
            <p className="text-sm text-red-400 mb-3 text-center">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !agree1 || !agree2}
            className="w-full py-4 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                Wysyłanie...
              </span>
            ) : (
              "Złóż zamówienie"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
