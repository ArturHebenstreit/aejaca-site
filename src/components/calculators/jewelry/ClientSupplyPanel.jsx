const SECTION_TITLE = {
  pl: "Materiały od klienta",
  en: "Client-supplied materials",
  de: "Kundenmaterial",
};

const METAL_LABEL = {
  pl: "Kruszec od klienta",
  en: "Client supplies metal",
  de: "Metall vom Kunden",
};

const METAL_NOTE = {
  pl: "Odejmiemy koszt metalu — dostarcz kruszec przed realizacją",
  en: "Metal cost excluded — supply raw metal before production",
  de: "Metallkosten entfallen — liefern Sie Rohmetall vor der Produktion",
};

const STONES_LABEL = {
  pl: "Kamienie od klienta",
  en: "Client supplies stones",
  de: "Steine vom Kunden",
};

const STONES_NOTE = {
  pl: "Odejmiemy koszt kamieni — ubezpieczamy je na czas realizacji",
  en: "Stone cost excluded — we insure them during production",
  de: "Steinkosten entfallen — wir versichern sie während der Produktion",
};

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-amber-500" : "bg-neutral-700 [data-theme='light']:bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SupplyRow({ icon, label, note, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
        checked
          ? "border-amber-400/25 bg-amber-400/8"
          : "border-white/8 bg-transparent hover:border-amber-400/20"
      }`}
    >
      <ToggleSwitch checked={checked} onChange={(e) => { e.stopPropagation(); onToggle(); }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-sm font-medium text-white [data-theme='light']:text-neutral-900">
            {label}
          </span>
        </div>
        {checked && note && (
          <div className="text-xs text-neutral-500 mt-0.5">{note}</div>
        )}
      </div>
    </div>
  );
}

export default function ClientSupplyPanel({ suppliesMetal, suppliesStones, onToggleMetal, onToggleStones, lang }) {
  const l = lang || "pl";

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-500 [data-theme='light']:text-neutral-600 uppercase tracking-wide mb-2">
        {SECTION_TITLE[l]}
      </div>

      <SupplyRow
        icon="⚖️"
        label={METAL_LABEL[l]}
        note={METAL_NOTE[l]}
        checked={!!suppliesMetal}
        onToggle={onToggleMetal}
      />

      <SupplyRow
        icon="💎"
        label={STONES_LABEL[l]}
        note={STONES_NOTE[l]}
        checked={!!suppliesStones}
        onToggle={onToggleStones}
      />
    </div>
  );
}
