import { useEffect, useState } from "react";
import {
  Store,
  Instagram,
  Music2,
  Facebook,
  Youtube,
  MapPin,
  Globe,
  Mail,
  MessageCircleMore,
} from "lucide-react";

function App() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

  // Ustaw tytuł strony
  useEffect(() => {
    document.title = "AEJaCA - Artisan Elegance Jewelry and Crafted Art";
  }, []);

  // Preload obrazów z /public
  useEffect(() => {
    const urls = ["/banner.jpg", "/logo.png"];
    let loaded = 0;
    urls.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (loaded === urls.length) setImagesReady(true);
      };
      img.src = src;
      // dodatkowo hintuj przeglądarce
      img.decoding = "async";
      img.fetchPriority = "high";
    });
  }, []);

  const links = [
    {
      icon: <Store className="w-5 h-5 inline-block mr-2 text-pink-700" />,
      label: "Etsy",
      url: "https://aejaca.etsy.com",
    },
    {
      icon: <Instagram className="w-5 h-5 inline-block mr-2 text-pink-500" />,
      label: "Instagram",
      url: "https://www.instagram.com/aejaca_",
    },
    {
      icon: <Music2 className="w-5 h-5 inline-block mr-2" />,
      label: "TikTok (PL)",
      url: "https://www.tiktok.com/@aejaca_",
    },
    {
      icon: <Music2 className="w-5 h-5 inline-block mr-2" />,
      label: "TikTok (US/UK)",
      url: "https://www.tiktok.com/@aejaca_us",
    },
    {
      icon: <Facebook className="w-5 h-5 inline-block mr-2 text-blue-700" />,
      label: "Facebook",
      url: "https://www.facebook.com/people/Artisan-Elegance-Jewelry-and-Crafted-Art/61570057929428/",
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
      icon: <Globe className="w-5 h-5 inline-block mr-2 text-slate-700" />,
      label: "Website",
      url: "https://www.aejaca.com",
    },
    {
      icon: (
        <MessageCircleMore className="w-5 h-5 inline-block mr-2 text-emerald-600" />
      ),
      label: "WhatsApp",
      url: "https://wa.me/48780737786",
    },
    {
      icon: <Mail className="w-5 h-5 inline-block mr-2 text-gray-600" />,
      label: "E-mail",
      url: "mailto:aejaca@gmail.com",
    },
  ];

  // Loader dopóki obrazy nie będą gotowe
  if (!imagesReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center text-gray-700">
          <div className="h-10 w-10 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading AEJaCA…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 flex flex-col items-center">
      {/* Banner – tylko na stronie głównej */}
      {!showPrivacy && (
        <img
          src="/banner.jpg"
          alt="AEJaCA banner"
          className="w-full max-w-4xl mb-4 rounded shadow-md"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      )}

      {/* Logo – tylko na stronie głównej */}
      {!showPrivacy && (
        <img
          src="/logo.png"
          alt="AEJaCA logo"
          className="w-[300px] h-[300px] mb-4 rounded-full shadow-lg object-contain"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      )}

      {/* Treść */}
      <div className="max-w-xl w-full text-gray-800 font-serif text-center">
        {showPrivacy ? (
          <>
            {/* Tytuł strony polityki */}
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 mb-8">
              AEJaCA – Artisan Elegance Jewelry and Crafted Art
            </p>

            <div className="text-left text-sm md:text-base space-y-4">
              <p>
                This Privacy Policy describes how AEJaCA collects, uses, and
                protects your personal data.
              </p>
              <p>
                We process data related to inquiries, personalization requests,
                and communication with clients. We do not sell or share your
                data with third parties.
              </p>
              <p>
                For more details, contact us at{" "}
                <a
                  href="mailto:contact@aejaca.com"
                  className="text-blue-600 underline"
                >
                  contact@aejaca.com
                </a>
                .
              </p>
              <p>
                By using our services, you agree to the practices described in
                this policy.
              </p>

              <hr className="my-8 border-gray-300" />

              <h2 className="text-lg font-semibold">Wersja polska</h2>
              <p>
                Niniejsza Polityka prywatności opisuje, w jaki sposób AEJaCA
                gromadzi, wykorzystuje i chroni Twoje dane osobowe. W sprawach
                szczegółowych pisz na{" "}
                <a
                  href="mailto:aejaca@gmail.com"
                  className="text-blue-600 underline"
                >
                  aejaca@gmail.com
                </a>
                .
              </p>
            </div>

            {/* Powrót */}
            <div className="mt-8">
              <button
                onClick={() => {
                  setShowPrivacy(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sm text-gray-700 underline hover:text-black"
              >
                ← Back to Main Page
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">
              ✨ Explore more of AEJaCA’s unique creations:
            </h1>
            <ul className="space-y-3 text-base md:text-lg">
              {links.map(({ icon, label, url }) => (
                <li key={label}>
                  {icon}
                  <strong>{label}:</strong>{" "}
                  <a
                    href={url}
                    className="text-blue-600 hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={() => {
                  setShowPrivacy(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sm text-gray-700 underline hover:text-black"
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
