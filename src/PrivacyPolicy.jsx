function PrivacyPolicy({ onBack }) {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800 font-sans">
      <h1 className="text-3xl font-bold mb-6">
        Privacy Policy / Polityka prywatności
      </h1>

      <h2 className="text-xl font-semibold mt-6 mb-2">English Version</h2>

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
        You have the right to access, edit, or delete your data, as well as file
        a complaint with your local data protection authority.
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

      <hr className="my-8 border-gray-400" />

      <h2 className="text-xl font-semibold mt-6 mb-2">Wersja polska</h2>

      <p className="mb-4">
        <strong>1. Administrator danych osobowych</strong>
        <br />
        Administratorem danych osobowych jest właściciel marki AEJaCA. Kontakt:{" "}
        <a href="mailto:aejaca@gmail.com" className="text-blue-600 underline">
          aejaca@gmail.com
        </a>
      </p>

      <p className="mb-4">
        <strong>2. Zakres i cel przetwarzania danych</strong>
        <br />
        Twoje dane mogą być przetwarzane w celu odpowiedzi na zapytania, analizy
        ruchu (np. Google Analytics) lub prezentacji treści.
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

      <button
        className="mt-8 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        onClick={onBack}
      >
        🔙 Back to homepage / Powrót do strony głównej
      </button>
    </div>
  );
}

export default PrivacyPolicy;
