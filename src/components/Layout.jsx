import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import JezykPodpowiedz from "./JezykPodpowiedz.jsx";
import Footer from "./Footer.jsx";
import ChatWidget from "./ChatWidget.jsx";
import ZnacznikRuchu from "./ZnacznikRuchu.jsx";
import { trackPageView, initScrollTracking, initToolTracking } from "../utils/analytics.js";
import useScrollToTop from "../hooks/useScrollToTop.js";

export default function Layout() {
  const location = useLocation();
  useScrollToTop();
  useEffect(() => {
    trackPageView(location.pathname);
    initScrollTracking();
    initToolTracking(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
      {/* Skip to content - accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Navbar />
      <JezykPodpowiedz />
      <main id="main-content" className="flex-1" role="main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <ZnacznikRuchu />
    </div>
  );
}
