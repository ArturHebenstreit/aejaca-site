// ============================================================
// SPIS TRESCI, PRZYPIETY DO GORY
// ============================================================
// Strony procesu maja po kilkanascie sekcji. Klient przychodzi z JEDNYM
// pytaniem ("na kiedy to bedzie", "jak zaplacic z zagranicy") i przewijanie
// calosci, zeby je znalezc, jest ta sama praca, ktorej strona miala go
// oszczedzic.
//
// Pasek przykleja sie pod naglowkiem, wiec droga do kazdej sekcji jest zawsze
// jednym kliknieciem, niezaleznie od tego, jak gleboko czytelnik zaszedl.

export default function SpisTresci({ pozycje, accent = "amber" }) {
  if (!pozycje.length) return null;
  const kolor = accent === "blue"
    ? "border-blue-400/30 text-blue-300 hover:border-blue-400/60"
    : "border-amber-400/30 text-amber-300 hover:border-amber-400/60";

  return (
    <nav className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-6 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
      <div className="flex flex-wrap gap-2">
        {pozycje.map((p) => (
          <a key={p.id} href={`#${p.id}`}
             className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${kolor}`}>
            {p.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
