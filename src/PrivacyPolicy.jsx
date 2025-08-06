function PrivacyPolicy({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10 text-gray-800 font-sans">
      {/* Banner title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600">
          AEJaCA – Artisan Elegance Jewelry and Crafted Art
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* English version */}
        <h2 className="text-2xl font-bold mt-8 mb-4">English Version</h2>

        <p className="mb-4">
          <strong>1. Data Controller</strong>
          <br />
          The data controller is the owner of the AEJaCA brand. Contact us at:{" "}
          <a href="mailto:aejaca@gmail.com" className="text-blue-600 underline">
            aejaca@gmail.com
          </a>
        </p>

        <p className="mb-4">
          <strong>2. Scope and Purpose of Data Processing</strong>
          <br />
          We may process your personal data to respond to inquiries, analyze
          traffic (e.g. via Google Analytics), or display personalized content.
        </p>

        <p className="mb-4">
          <strong>3. Your Rights</strong>
          <br />
          You have the right to access, edit, or delete your data, as well as
          file a complaint with your local data protection authority.
        </p>

        <p className="mb-4">
          <strong>4. Cookies</strong>
          <br />
          This site uses cookies for analytical and functional purposes.
        </p>

        <p className="mb-4">
          <strong>5. Changes to This Policy</strong>
          <br />
          Any updates will be posted on this page.
        </p>

        <hr className="my-10 border-gray-400" />

        {/* Polish version */}
        <h2 className="text-2xl font-bold mt-8 mb-4">Wersja polska</h2>

        <p className="mb-4">
          <strong>1. Administrator danych osobowych</strong>
          <br />
          Administratorem danych osobowych jest właściciel marki AEJaCA.
          Kontakt:{" "}
          <a href="mailto:aejaca@gmail.com" className="text-blue-600 underline">
            aejaca@gmail.com
          </a>
        </p>

        <p className="mb-4">
          <strong>2. Zakres i cel przetwarzania danych</strong>
          <br />
          Twoje dane mogą być przetwarzane w celu odpowiedzi na zapytania,
          analizy ruchu (np. Google Analytics) lub prezentacji treści.
        </p>

        <p className="mb-4">
          <strong>3. Prawa użytkownika</strong>
          <br />
          Masz prawo do wglądu, edycji i usunięcia swoich danych, a także do
          złożenia skargi do organu ochrony danych osobowych.
        </p>

        <p className="mb-4">
          <strong>4. Pliki cookies</strong>
          <br />
          Strona wykorzystuje pliki cookies w celach analitycznych i
          funkcjonalnych.
        </p>

        <p className="mb-4">
          <strong>5. Zmiany polityki</strong>
          <br />
          Wszelkie zmiany będą publikowane na tej stronie.
        </p>

        {/* Back button */}
        <div className="text-center mt-12">
          <button
            className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-900 transition"
            onClick={onBack}
          >
            🔙 Back to homepage / Powrót do strony głównej
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
