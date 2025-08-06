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
        {/* Banner */}
        <div className="flex justify-center mb-6">
          <img
            src="/banner.jpg"
            alt="AEJaCA Banner"
            className="w-full max-w-3xl rounded-lg shadow-md"
          />
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="AEJaCA Logo"
            className="w-[300px] h-[300px] object-contain mx-auto"
          />
        </div>

        {/* Nagłówek i linki */}
        <h1 className="text-2xl md:text-3xl font-semibold mb-6">
          🌐 AEJaCA Official Links:
        </h1>
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
            Polityka prywatności
          </button>
        </div>
      </div>
    </div>
  );
}
export default App;
