import { useState, useEffect } from "react";
import PrivacyPolicy from "./PrivacyPolicy";
import {
  Store,
  Instagram,
  Music2,
  Globe,
  Facebook,
  Youtube,
  MapPin,
  Mail,
} from "lucide-react";

function App() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    document.title = "AEJaCA - Artisan Elegance Jewelry and Crafted Art";
  }, []);

  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  const links = [
    {
      icon: <Store className="w-5 h-5 inline-block mr-2 text-pink-700" />,
      label: "Etsy",
      url: "https://aejaca.etsy.com",
    },
    {
      icon: <Instagram className="w-5 h-5 inline-block mr-2 text-pink-500" />,
      label: "Instagram EN",
      url: "https://www.instagram.com/aejaca_",
    },
    {
      icon: <Music2 className="w-5 h-5 inline-block mr-2 text-black" />,
      label: "TikTok (PL)",
      url: "https://www.tiktok.com/@aejaca_",
    },
    {
      icon: <Music2 className="w-5 h-5 inline-block mr-2 text-black" />,
      label: "TikTok (EN)",
      url: "https://www.tiktok.com/@aejaca_us",
    },
    {
      icon: <Facebook className="w-5 h-5 inline-block mr-2 text-blue-700" />,
      label: "Facebook",
      url: "https://www.facebook.com/share/1BHNLAy4f2/?mibextid=wwXIfr",
    },
    {
      icon: <Youtube className="w-5 h-5 inline-block mr-2 text-red-600" />,
      label: "YouTube",
      url: "https://www.youtube.com/@aejaca",
    },
    {
      icon: <MapPin className="w-5 h-5 inline-block mr-2 text-green-700" />,
      label: "Google Maps",
      url: "https://maps.app.goo.gl/D9XHVQD4ufjjA5X18",
    },
    {
      icon: <Mail className="w-5 h-5 inline-block mr-2 text-gray-600" />,
      label: "✉️ E-mail",
      url: "mailto:aejaca@gmail.com",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 text-center">
      <div className="max-w-xl text-gray-800 font-serif">
        {showPrivacy ? (
          <div>
            {/* Tytuł strony z polityką prywatności */}
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">
              Privacy Policy
            </h1>

            {/* Treść polityki */}
            <div className="text-left text-sm md:text-base space-y-4">
              <p>
                This Privacy Policy describes how AEJaCA collects, uses, and
                protects your personal data.
              </p>
              <p>
                We process data related to purchases, personalization requests,
                and communication with clients. We do not sell or share your
                data with third parties.
              </p>
              <p>
                For more details, contact us at{" "}
                <a
                  href="mailto:aejaca@gmail.com"
                  className="text-blue-600 underline"
                >
                  aejaca@gmail.com
                </a>
                .
              </p>
              <p>
                By using our services, you agree to the practices described in
                this policy.
              </p>
            </div>

            {/* Przycisk powrotu */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-sm text-gray-600 underline hover:text-black"
              >
                ← Back
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tytuł strony głównej */}
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">
              🌐 AEJaCA Official Links:
            </h1>

            {/* Lista linków */}
            <ul className="space-y-3 text-base md:text-lg">
              {links.map(({ icon, label, url }) => (
                <li key={label}>
                  {icon}
                  <strong>{label}:</strong>{" "}
                  <a
                    href={url}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>

            {/* Przycisk do polityki prywatności */}
            <div className="mt-8">
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-sm text-gray-600 underline hover:text-black"
              >
                Privacy Policy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default App;
