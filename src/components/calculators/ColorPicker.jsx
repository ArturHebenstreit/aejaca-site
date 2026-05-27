import { useState } from "react";

const FILAMENT_COLORS = [
  { id: "white", name: { pl: "Biały", en: "White", de: "Weiß" }, hex: "#f5f5f5" },
  { id: "black", name: { pl: "Czarny", en: "Black", de: "Schwarz" }, hex: "#1a1a1a" },
  { id: "gray", name: { pl: "Szary", en: "Gray", de: "Grau" }, hex: "#888888" },
  { id: "silver", name: { pl: "Srebrny", en: "Silver", de: "Silber" }, hex: "#c0c0c0" },
  { id: "red", name: { pl: "Czerwony", en: "Red", de: "Rot" }, hex: "#cc2222" },
  { id: "blue", name: { pl: "Niebieski", en: "Blue", de: "Blau" }, hex: "#1a5fb4" },
  { id: "green", name: { pl: "Zielony", en: "Green", de: "Grün" }, hex: "#26a269" },
  { id: "yellow", name: { pl: "Żółty", en: "Yellow", de: "Gelb" }, hex: "#e5a50a" },
  { id: "orange", name: { pl: "Pomarańczowy", en: "Orange", de: "Orange" }, hex: "#e66100" },
  { id: "purple", name: { pl: "Fioletowy", en: "Purple", de: "Lila" }, hex: "#813d9c" },
  { id: "pink", name: { pl: "Różowy", en: "Pink", de: "Rosa" }, hex: "#e91e8c" },
  { id: "brown", name: { pl: "Brązowy", en: "Brown", de: "Braun" }, hex: "#7a4510" },
  { id: "natural", name: { pl: "Naturalny", en: "Natural", de: "Natur" }, hex: "#f0e6d0" },
  { id: "transparent", name: { pl: "Transparentny", en: "Transparent", de: "Transparent" }, hex: "#e0f0ff", border: true },
  { id: "other", name: { pl: "Inny kolor", en: "Other color", de: "Andere Farbe" }, hex: null },
];

export default function ColorPicker({ value, onChange, lang = "pl" }) {
  const [customNote, setCustomNote] = useState("");
  const t = (obj) => obj?.[lang] || obj?.pl || "";

  const selected = value?.id || null;

  function select(color) {
    if (color.id === "other") {
      onChange({ id: "other", name: t(color.name), hex: null, note: customNote });
    } else {
      onChange({ id: color.id, name: t(color.name), hex: color.hex });
    }
  }

  const placeholders = {
    pl: "Opisz kolor lub podaj kod RAL…",
    en: "Describe color or RAL code…",
    de: "Farbe beschreiben oder RAL-Code…",
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILAMENT_COLORS.map(c => {
          const isSelected = selected === c.id;
          if (c.id === "other") {
            return (
              <button
                key="other"
                onClick={() => select(c)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                  isSelected
                    ? "border-amber-400 bg-amber-400/10 text-amber-700 font-medium"
                    : "border-white/10 text-neutral-500 hover:border-white/20"
                }`}
              >
                {t(c.name)}
              </button>
            );
          }
          return (
            <button
              key={c.id}
              onClick={() => select(c)}
              title={t(c.name)}
              className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 ${
                isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900 scale-110" : ""
              } ${c.border ? "border border-neutral-400" : ""}`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      {selected && selected !== "other" && (
        <p className="text-xs text-neutral-400">
          {t(FILAMENT_COLORS.find(c => c.id === selected)?.name)}
        </p>
      )}
      {selected === "other" && (
        <input
          type="text"
          value={customNote}
          onChange={e => {
            setCustomNote(e.target.value);
            onChange({ id: "other", name: "Inny kolor", hex: null, note: e.target.value });
          }}
          placeholder={placeholders[lang] || placeholders.pl}
          className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-amber-400/40 focus:outline-none"
        />
      )}
    </div>
  );
}
