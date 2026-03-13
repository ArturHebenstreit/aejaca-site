import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="pt-16">
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-neutral-500 mb-10">
            AEJaCA &mdash; Artisan Elegance Jewelry and Crafted Art
          </p>

          <div className="space-y-6 text-neutral-300 text-sm leading-relaxed">
            <p>
              This Privacy Policy describes how AEJaCA collects, uses, and
              protects your personal data when you interact with our website,
              services, and communications.
            </p>
            <p>
              We process data related to inquiries, personalization requests,
              orders, and communication with clients. We do not sell or share your
              personal data with third parties for marketing purposes.
            </p>
            <p>
              The data we collect may include your name, email address, phone number,
              and project details — only when you voluntarily provide this information
              through our contact form or direct communication channels.
            </p>
            <p>
              We use this data solely to respond to your inquiries, fulfill orders,
              and improve our services. Your data is stored securely and retained
              only as long as necessary for the stated purposes.
            </p>
            <p>
              For more details or to request data deletion, contact us at{" "}
              <a href="mailto:contact@aejaca.com" className="text-amber-400 hover:underline">
                contact@aejaca.com
              </a>.
            </p>
            <p>
              By using our website and services, you agree to the practices described
              in this policy.
            </p>

            <hr className="border-white/10 my-10" />

            <h2 className="text-xl font-semibold text-white">Wersja polska</h2>
            <p>
              Niniejsza Polityka Prywatności opisuje, w jaki sposób AEJaCA gromadzi,
              wykorzystuje i chroni Twoje dane osobowe podczas korzystania z naszej
              strony internetowej, usług i komunikacji.
            </p>
            <p>
              Przetwarzamy dane związane z zapytaniami, zamówieniami personalizacji
              oraz komunikacją z klientami. Nie sprzedajemy ani nie udostępniamy
              Twoich danych osobowych stronom trzecim w celach marketingowych.
            </p>
            <p>
              Dane, które gromadzimy, mogą obejmować Twoje imię, adres e-mail,
              numer telefonu i szczegóły projektu — wyłącznie gdy dobrowolnie
              podajesz te informacje przez formularz kontaktowy lub bezpośrednie
              kanały komunikacji.
            </p>
            <p>
              W sprawach szczegółowych lub w celu żądania usunięcia danych, napisz na{" "}
              <a href="mailto:contact@aejaca.com" className="text-amber-400 hover:underline">
                contact@aejaca.com
              </a>.
            </p>
          </div>

          <div className="mt-12">
            <Link
              to="/"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
