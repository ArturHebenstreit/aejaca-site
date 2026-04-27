import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const CATEGORY_COLORS_AMBER = {
  rings: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  earrings: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  pendants: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  symbolic: "bg-amber-600/10 text-amber-300 border-amber-600/20",
};

const CATEGORY_COLORS_BLUE = {
  "3dprint": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  laser: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  engrave: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  nfc: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  custom: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const AUTO_SCROLL_MS = 4500;

export default function Portfolio({ data, accent = "amber", id }) {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);
  const autoTimer = useRef(null);
  const sectionRef = useScrollReveal();

  const isAmber = accent === "amber";
  const tagColor = isAmber ? "text-amber-400" : "text-blue-400";
  const activeBtn = isAmber ? "bg-amber-500 text-black" : "bg-blue-500 text-white";
  const accentRing = isAmber ? "ring-amber-500/40" : "ring-blue-500/40";
  const dotActive = isAmber ? "bg-amber-400" : "bg-blue-400";
  const colorMap = isAmber ? CATEGORY_COLORS_AMBER : CATEGORY_COLORS_BLUE;

  const filtered = filter === "all" ? data.items : data.items.filter((item) => item.category === filter);

  const getItemsPerPage = useCallback(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    function onResize() { setItemsPerPage(getItemsPerPage()); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getItemsPerPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filter]);

  const scrollToPage = useCallback((page) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(clamped);
    const cardWidth = el.scrollWidth / filtered.length;
    el.scrollTo({ left: clamped * itemsPerPage * cardWidth, behavior: "smooth" });
  }, [totalPages, filtered.length, itemsPerPage]);

  const next = useCallback(() => scrollToPage((currentPage + 1) % totalPages), [currentPage, totalPages, scrollToPage]);
  const prev = useCallback(() => scrollToPage(currentPage === 0 ? totalPages - 1 : currentPage - 1), [currentPage, totalPages, scrollToPage]);

  useEffect(() => {
    if (isPaused || lightbox !== null || totalPages <= 1) return;
    autoTimer.current = setInterval(next, AUTO_SCROLL_MS);
    return () => clearInterval(autoTimer.current);
  }, [isPaused, lightbox, next, totalPages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      const cardWidth = el.scrollWidth / filtered.length;
      const page = Math.round(el.scrollLeft / (itemsPerPage * cardWidth));
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [filtered.length, itemsPerPage, totalPages]);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((p) => (p + 1) % filtered.length);
      if (e.key === "ArrowLeft") setLightbox((p) => (p - 1 + filtered.length) % filtered.length);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox, filtered.length]);

  return (
    <section id={id} className="py-20 px-4 bg-neutral-900/50">
      <div ref={sectionRef} className="reveal max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className={`${tagColor} text-xs uppercase tracking-[0.2em] mb-3`}>{data.tag}</div>
          <h2 className={`${isAmber ? "font-serif" : "font-sans"} text-3xl md:text-4xl font-semibold text-white ${!isAmber ? "tracking-tight font-bold" : ""}`}>
            {data.title}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
              filter === "all" ? activeBtn : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {data.filterAll}
          </button>
          {data.filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                filter === f.id ? activeBtn : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div
          className="relative group/carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left arrow */}
          {totalPages > 1 && (
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-0 top-0 bottom-12 w-12 z-10 flex items-center justify-center bg-gradient-to-r from-neutral-900/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
            </button>
          )}

          {/* Right arrow */}
          {totalPages > 1 && (
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-0 top-0 bottom-12 w-12 z-10 flex items-center justify-center bg-gradient-to-l from-neutral-900/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
            </button>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filtered.map((item, i) => {
              const catColor = colorMap[item.category] || colorMap.custom || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
              const widthClass =
                itemsPerPage === 1 ? "min-w-[calc(100%-0px)]" :
                itemsPerPage === 2 ? "min-w-[calc(50%-8px)]" :
                "min-w-[calc(25%-12px)]";

              return (
                <div
                  key={item.title + filter}
                  className={`${widthClass} snap-start flex-shrink-0 rounded-xl bg-white/[0.03] border border-white/5 ${isAmber ? "hover:border-amber-500/20" : "hover:border-blue-500/20"} transition-all duration-300 group/card overflow-hidden cursor-pointer`}
                  onClick={() => setLightbox(i)}
                >
                  {item.img && (
                    <div className="overflow-hidden relative">
                      <img
                        src={item.img}
                        alt={item.title}
                        loading="lazy"
                        className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium border mb-2 ${catColor}`}>
                      {data.filters.find((f) => f.id === item.category)?.label || item.category}
                    </div>
                    <h3 className={`text-white font-medium text-sm mb-1 ${isAmber ? "group-hover/card:text-amber-300" : "group-hover/card:text-blue-300"} transition-colors`}>
                      {item.title}
                    </h3>
                    <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToPage(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? `w-6 h-2 ${dotActive}`
                      : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
              <span className="ml-3 text-neutral-500 text-xs">
                {currentPage + 1} / {totalPages}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + filtered.length) % filtered.length); }}
                className="absolute left-4 text-white/70 hover:text-white z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % filtered.length); }}
                className="absolute right-4 text-white/70 hover:text-white z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          <div className="max-w-3xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={filtered[lightbox].img}
              alt={filtered[lightbox].title}
              className={`max-h-[70vh] w-auto rounded-xl shadow-2xl ring-1 ${accentRing}`}
            />
            <div className="mt-4 text-center">
              <h3 className="text-white text-lg font-medium">{filtered[lightbox].title}</h3>
              <p className="text-neutral-400 text-sm mt-1 max-w-md">{filtered[lightbox].desc}</p>
              <div className="text-neutral-500 text-xs mt-2">{lightbox + 1} / {filtered.length}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
