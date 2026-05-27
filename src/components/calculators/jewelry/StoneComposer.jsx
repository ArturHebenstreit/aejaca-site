// ============================================================
// STONE COMPOSER — multi-row gemstone selector for JewelryCalc
// ============================================================
// Props:
//   stoneRows: array of { rowId, gemId, stoneSizeId, count, suppliedBy,
//                          clarityId, colorId, qualityId, certId }
//   onChange: (newRows) => void
//   lang: "pl" | "en" | "de"
//   gemstones: resolved gemstones array (with live basePLN)
// ============================================================
import { t } from "../calcShared.jsx";
import { useTheme } from "../../../i18n/ThemeContext.jsx";
import {
  STONE_SIZES,
  DIAMOND_CLARITY,
  DIAMOND_COLOR,
  GEM_QUALITY,
  CERTIFICATIONS,
} from "../jewelryConfig.js";

const ADD_LABEL = {
  pl: "Dodaj kolejny kamień",
  en: "Add another stone",
  de: "Weiteren Stein hinzufügen",
};

const SUPPLY_LABELS = {
  studio: { pl: "AEJaCA", en: "AEJaCA", de: "AEJaCA" },
  client: { pl: "Klient", en: "Client", de: "Kunde" },
};

const CLIENT_NOTE = {
  pl: "Kamień dostarczony przez klienta. Kwestia ubezpieczenia kamienia na czas realizacji wymaga osobnego uzgodnienia i może wpłynąć na finalną cenę. W przypadku braku ubezpieczenia odpowiedzialność za kamień pozostaje po stronie klienta.",
  en: "Stone supplied by client. Insurance of the stone during production requires separate agreement and may affect the final price. Without insurance, the client bears responsibility for the stone.",
  de: "Stein vom Kunden geliefert. Die Versicherung des Steins während der Produktion bedarf einer gesonderten Vereinbarung und kann den Endpreis beeinflussen. Ohne Versicherung liegt die Verantwortung für den Stein beim Kunden.",
};

// ---- Single stone row ----
function StoneRow({ row, gemstones, onChange, onRemove, lang, canRemove, isLast }) {
  const selectedGem = gemstones.find(g => g.id === row.gemId);
  const isDiamond = row.gemId === "diamond" || row.gemId === "lab_diamond";
  const showGrades = selectedGem && selectedGem.hasGrades && row.gemId !== "none";
  const isConfigured = row.gemId !== "none";
  const { isDark } = useTheme();

  // Theme-aware pill classes — match JewelryCalc "Brak" card style in light mode
  const activePill = isDark
    ? "border-amber-400 bg-amber-400/25 text-amber-200 font-semibold shadow-sm shadow-amber-400/25"
    : "border-amber-400 bg-amber-400/10 text-amber-700 font-medium";
  const inactivePill = isDark
    ? "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
    : "border-neutral-200 bg-white/[0.02] text-neutral-600 hover:border-neutral-400";

  function update(patch) {
    onChange({ ...row, ...patch });
  }

  return (
    <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
      isConfigured
        ? "border-amber-400/20 bg-white/[0.02]"
        : "border-white/8 bg-white/[0.02]"
    }`}>
      {/* Row header: remove button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 [data-theme='light']:text-neutral-600 font-bold">
          {{ pl: "Kamień", en: "Stone", de: "Stein" }[lang]}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            aria-label="Remove stone row"
            className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs"
          >
            ×
          </button>
        )}
      </div>

      {/* Gem selector — horizontal scrollable strip */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1.5 min-w-max">
          {gemstones.map(g => {
            const active = row.gemId === g.id;
            const label = t(g.label, lang);
            const isSpecial = g.id === "none" || g.custom;
            // "Brak kamienia" locked for non-last rows (row has a successor)
            const isNoneLocked = g.id === "none" && !isLast;
            return (
              <button
                key={g.id}
                onClick={() => !isNoneLocked && update({ gemId: g.id })}
                disabled={isNoneLocked}
                title={isNoneLocked ? ({ pl: "Usuń następny kamień aby wybrać brak", en: "Remove next stone to select none", de: "Nächsten Stein entfernen um 'Kein' zu wählen" }[lang]) : undefined}
                className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all shrink-0 w-14 ${
                  isNoneLocked ? "border-dashed border-white/5 opacity-30 cursor-not-allowed" :
                  isSpecial && !active ? (isDark ? "border-dashed border-white/10 hover:border-white/20" : "border-dashed border-neutral-200 hover:border-neutral-400") :
                  isSpecial && active ? (isDark ? "border-dashed border-amber-400 bg-amber-400/25 shadow-md shadow-amber-400/30" : "border-dashed border-amber-400 bg-amber-400/10") :
                  active ? (isDark ? "border-amber-400 bg-amber-400/25 shadow-md shadow-amber-400/30" : "border-amber-400 bg-amber-400/10") :
                  (isDark ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-neutral-200 bg-white hover:border-neutral-400")
                }`}
              >
                <div className={`w-10 aspect-square rounded-lg overflow-hidden ${
                  g.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                }`}>
                  {g.img ? (
                    <img src={g.img} alt={label} loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-300 ${active ? "scale-105" : "hover:scale-105"}`} />
                  ) : (
                    <span className={`text-base ${isSpecial ? "opacity-40" : "opacity-60"}`}>
                      {g.id === "none" ? "∅" : g.custom ? "?" : "◆"}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] text-center leading-tight break-all ${
                  active ? (isDark ? "text-amber-200 font-semibold" : "text-amber-900 font-semibold") : "text-neutral-500"
                }`}>
                  {label}
                </span>
                {g.lab && (
                  <span className={`absolute top-0.5 right-0.5 text-[7px] px-0.5 py-0 rounded font-semibold tracking-wider ${
                    active
                      ? (isDark ? "bg-amber-400/30 text-amber-200" : "bg-amber-600 text-white")
                      : "bg-black/60 text-amber-400/80"
                  }`}>LAB</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stone details — only when gem is configured (not "none") */}
      {isConfigured && (
        <>
          {/* Size pills — always shown for configured stones incl. custom */}
          <div>
            <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
              {{ pl: "Wielkość", en: "Size", de: "Größe" }[lang]}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STONE_SIZES.filter(s => !s.custom).map(s => {
                const active = row.stoneSizeId === s.id;
                const v = s.visual;
                return (
                  <button key={s.id} onClick={() => update({ stoneSizeId: s.id })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[10px] ${active ? activePill : inactivePill}`}>
                    {v && (
                      <span className="rounded-full shrink-0" style={{
                        width: Math.max(4, Math.min(v.gemD * 0.6, 14)),
                        height: Math.max(4, Math.min(v.gemD * 0.6, 14)),
                        background: active
                          ? (isDark ? "rgb(251 191 36 / 0.6)" : "rgb(180 83 9 / 0.55)")
                          : (isDark ? "rgb(255 255 255 / 0.25)" : "rgb(0 0 0 / 0.12)"),
                        display: "inline-block",
                      }} />
                    )}
                    {t(s.label, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count — always shown for configured stones incl. custom */}
          <div>
            <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
              {{ pl: "Liczba kamieni", en: "Count", de: "Anzahl" }[lang]}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update({ count: Math.max(1, (parseInt(row.count) || 1) - 1) })}
                className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 hover:border-amber-400/30 hover:text-amber-300 transition-all text-sm flex items-center justify-center"
              >−</button>
              <input
                type="number"
                min={1}
                max={200}
                value={row.count}
                onChange={e => {
                  const v = Math.max(1, Math.min(200, parseInt(e.target.value) || 1));
                  update({ count: v });
                }}
                className="w-14 text-center bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-amber-400/40 focus:outline-none transition-colors"
              />
              <button
                onClick={() => update({ count: Math.min(200, (parseInt(row.count) || 1) + 1) })}
                className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 hover:border-amber-400/30 hover:text-amber-300 transition-all text-sm flex items-center justify-center"
              >+</button>
            </div>
          </div>

          {/* Who supplies — always shown for configured stones incl. custom */}
          <div>
            <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
              {{ pl: "Kto dostarcza kamień", en: "Who supplies stone", de: "Wer liefert den Stein" }[lang]}
            </div>
            <div className="flex gap-2">
              {["studio", "client"].map(src => (
                <button key={src} onClick={() => update({ suppliedBy: src })}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${row.suppliedBy === src ? activePill : inactivePill}`}>
                  {t(SUPPLY_LABELS[src], lang)}
                </button>
              ))}
            </div>
            {row.suppliedBy === "client" && (
              <div className="mt-2 p-3 rounded-xl bg-amber-400/8 border border-amber-400/20 text-xs text-amber-200 leading-relaxed">
                {CLIENT_NOTE[lang]}
              </div>
            )}
          </div>

          {/* Quality grades + cert — only for known (non-custom) gems */}
          {!selectedGem?.custom && (
            <>
              {/* Diamond grades */}
              {showGrades && isDiamond && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
                      {{ pl: "Czystość", en: "Clarity", de: "Reinheit" }[lang]}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DIAMOND_CLARITY.map(c => (
                        <button key={c.id} onClick={() => update({ clarityId: c.id })}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${row.clarityId === c.id ? activePill : inactivePill}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
                      {{ pl: "Barwa", en: "Color", de: "Farbe" }[lang]}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DIAMOND_COLOR.map(c => (
                        <button key={c.id} onClick={() => update({ colorId: c.id })}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${row.colorId === c.id ? activePill : inactivePill}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Colored gem quality */}
              {showGrades && !isDiamond && (
                <div>
                  <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
                    {{ pl: "Jakość", en: "Quality", de: "Qualität" }[lang]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GEM_QUALITY.map(q => (
                      <button key={q.id} onClick={() => update({ qualityId: q.id })}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${row.qualityId === q.id ? activePill : inactivePill}`}>
                        {t(q.label, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate — only for diamond / lab_diamond */}
              {isDiamond && (
                <div>
                  <div className="text-[10px] text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide font-medium">
                    {{ pl: "Certyfikat", en: "Certificate", de: "Zertifikat" }[lang]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CERTIFICATIONS.map(c => (
                      <button key={c.id} onClick={() => update({ certId: c.id })}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] transition-all ${row.certId === c.id ? activePill : inactivePill}`}>
                        {t(c.label, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---- Main StoneComposer ----
export default function StoneComposer({ stoneRows, onChange, lang, gemstones }) {
  const { isDark } = useTheme();
  function updateRow(idx, newRow) {
    const next = stoneRows.map((r, i) => i === idx ? newRow : r);
    onChange(next);
  }

  function removeRow(idx) {
    if (stoneRows.length <= 1) return;
    onChange(stoneRows.filter((_, i) => i !== idx));
  }

  function addRow() {
    if (stoneRows.length >= 10) return;
    onChange([...stoneRows, {
      rowId: `row${Date.now()}`,
      gemId: "none",
      stoneSizeId: "small",
      count: 1,
      suppliedBy: "studio",
      clarityId: "VS",
      colorId: "GH",
      qualityId: "A",
      certId: "none",
    }]);
  }

  return (
    <div className="space-y-3">
      {stoneRows.map((row, idx) => (
        <StoneRow
          key={row.rowId}
          row={row}
          gemstones={gemstones}
          onChange={newRow => updateRow(idx, newRow)}
          onRemove={() => removeRow(idx)}
          lang={lang}
          canRemove={stoneRows.length > 1}
          isLast={idx === stoneRows.length - 1}
        />
      ))}

      {stoneRows.length < 10 && (() => {
        const lastRow = stoneRows[stoneRows.length - 1];
        const canAdd = lastRow && lastRow.gemId !== "none";
        return (
          <button
            onClick={canAdd ? addRow : undefined}
            disabled={!canAdd}
            className={`w-full py-2 rounded-xl border-dashed border text-xs transition-all ${
              canAdd
                ? isDark
                  ? "border-amber-400/40 text-amber-400 hover:border-amber-400 hover:bg-amber-400/5 cursor-pointer"
                  : "border-amber-500 text-amber-700 hover:bg-amber-50 cursor-pointer font-medium"
                : isDark
                  ? "border-white/5 text-neutral-700 cursor-not-allowed opacity-50"
                  : "border-neutral-200 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            + {ADD_LABEL[lang] || ADD_LABEL.en}
          </button>
        );
      })()}

      {/* General gem price disclaimer */}
      <p className="text-[11px] text-neutral-600 leading-relaxed pt-1">
        {{
          pl: "⚠ Ceny kamieni są orientacyjne i wymagają finalnego potwierdzenia przed realizacją zamówienia.",
          en: "⚠ Gemstone prices are indicative and require final confirmation before order execution.",
          de: "⚠ Edelsteinpreise sind Richtwerte und müssen vor der Auftragsausführung endgültig bestätigt werden.",
        }[lang]}
      </p>
    </div>
  );
}
