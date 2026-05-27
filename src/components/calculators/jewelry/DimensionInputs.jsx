import { getProductType, EU_RING_SIZES, US_RING_SIZES, UK_RING_SIZES, JP_RING_SIZES, getRingInnerDiameter } from "./productConfig.js";
import { t } from "../calcShared.jsx";

function NumberField({ field, value, onChange, lang }) {
  const val = value !== undefined ? value : field.default;

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide">
        {t(field.label, lang)}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={val}
          onChange={(e) => onChange(field.id, Number(e.target.value))}
          className="w-full bg-transparent border border-white/10 [data-theme='light']:border-black/10 rounded-lg px-3 py-2 text-sm text-white [data-theme='light']:text-neutral-900 focus:outline-none focus:border-amber-400/50"
        />
        <span className="text-xs text-neutral-500 ml-2 shrink-0">{field.unit}</span>
      </div>
      <div className="text-[11px] text-neutral-600 mt-0.5">
        {field.min}–{field.max} {field.unit}
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={val}
        onChange={(e) => onChange(field.id, Number(e.target.value))}
        className="w-full accent-amber-400 mt-1"
      />
    </div>
  );
}

function SelectField({ field, value, onChange, lang }) {
  const val = value !== undefined ? value : field.default;

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide">
        {t(field.label, lang)}
      </label>
      <div className="flex flex-wrap gap-2 mt-1">
        {field.options.map((opt) => {
          const selected = val === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(field.id, opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all duration-200 ${
                selected
                  ? "bg-amber-400/15 border-amber-400/40 text-amber-300 [data-theme='light']:text-amber-700"
                  : "bg-transparent border-white/10 text-neutral-400 hover:border-amber-400/20"
              }`}
            >
              {t(opt, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleField({ field, value, onChange, lang }) {
  const checked = value !== undefined ? value : field.default;

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide">
        {t(field.label, lang)}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(field.id, !checked)}
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
        <span className="text-sm text-neutral-300 [data-theme='light']:text-neutral-700">
          {t(field.label, lang)}
        </span>
      </div>
    </div>
  );
}

const RING_SYSTEMS = ["EU", "US", "UK", "JP", "mm"];

const SYSTEM_DEFAULTS = {
  EU: 54,
  US: "6",
  UK: "N",
  JP: "10",
  mm: 17.2,
};

function RingSizeField({ field, value, onChange }) {
  const val = (value && typeof value === "object") ? value : field.default;
  const system = val.system || "EU";
  const sizeValue = val.value !== undefined ? val.value : SYSTEM_DEFAULTS[system];

  const innerDiameter = getRingInnerDiameter(system, sizeValue);

  function changeSystem(newSystem) {
    onChange(field.id, { system: newSystem, value: SYSTEM_DEFAULTS[newSystem] });
  }

  function changeValue(newValue) {
    onChange(field.id, { system, value: newValue });
  }

  const euKeys = Object.keys(EU_RING_SIZES).map(Number).sort((a, b) => a - b);
  const usKeys = Object.keys(US_RING_SIZES);
  const ukKeys = Object.keys(UK_RING_SIZES);
  const jpKeys = Object.keys(JP_RING_SIZES).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      {/* System selector pills */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 [data-theme='light']:text-neutral-600 mb-1.5 uppercase tracking-wide">
          {typeof field.label === "object" ? (field.label.en || field.label.pl) : field.label}
        </label>
        <div className="flex gap-2 flex-wrap">
          {RING_SYSTEMS.map((sys) => (
            <button
              key={sys}
              type="button"
              onClick={() => changeSystem(sys)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all duration-200 ${
                system === sys
                  ? "bg-amber-400/15 border-amber-400/40 text-amber-300"
                  : "bg-transparent border-white/10 text-neutral-400 hover:border-amber-400/20"
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {/* Value input */}
      <div>
        {system === "EU" && (
          <select
            value={sizeValue}
            onChange={(e) => changeValue(Number(e.target.value))}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 [data-theme='light']:bg-white [data-theme='light']:text-neutral-900 [data-theme='light']:border-black/10"
          >
            {euKeys.map((k) => (
              <option key={k} value={k}>
                {k} → ø{EU_RING_SIZES[k].toFixed(1)} mm
              </option>
            ))}
          </select>
        )}

        {system === "US" && (
          <select
            value={String(sizeValue)}
            onChange={(e) => changeValue(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 [data-theme='light']:bg-white [data-theme='light']:text-neutral-900 [data-theme='light']:border-black/10"
          >
            {usKeys.map((k) => (
              <option key={k} value={k}>
                US {k} → ø{US_RING_SIZES[k].toFixed(1)} mm
              </option>
            ))}
          </select>
        )}

        {system === "UK" && (
          <select
            value={String(sizeValue)}
            onChange={(e) => changeValue(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 [data-theme='light']:bg-white [data-theme='light']:text-neutral-900 [data-theme='light']:border-black/10"
          >
            {ukKeys.map((k) => (
              <option key={k} value={k}>
                UK {k} → ø{UK_RING_SIZES[k].toFixed(1)} mm
              </option>
            ))}
          </select>
        )}

        {system === "JP" && (
          <select
            value={String(sizeValue)}
            onChange={(e) => changeValue(Number(e.target.value))}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 [data-theme='light']:bg-white [data-theme='light']:text-neutral-900 [data-theme='light']:border-black/10"
          >
            {jpKeys.map((k) => (
              <option key={k} value={k}>
                JP {k} → ø{JP_RING_SIZES[String(k)].toFixed(1)} mm
              </option>
            ))}
          </select>
        )}

        {system === "mm" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400 shrink-0">ø mm</span>
            <input
              type="number"
              min={12}
              max={25}
              step={0.1}
              placeholder="17.2"
              value={sizeValue}
              onChange={(e) => changeValue(parseFloat(e.target.value) || 17.2)}
              className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 [data-theme='light']:border-black/10 [data-theme='light']:text-neutral-900"
            />
          </div>
        )}
      </div>

      {/* Resolved diameter display */}
      <span className="text-xs text-amber-400">ø {innerDiameter.toFixed(1)} mm</span>
    </div>
  );
}

export default function DimensionInputs({ productTypeId, values, onChange, lang }) {
  const pt = getProductType(productTypeId);
  if (!pt) return null;

  return (
    <div className="space-y-4">
      {pt.fields.map((field) => {
        const value = values[field.id] !== undefined ? values[field.id] : field.default;

        if (field.type === "ringSize") {
          return (
            <RingSizeField
              key={field.id}
              field={field}
              value={value}
              onChange={onChange}
              lang={lang}
            />
          );
        }

        if (field.type === "number") {
          return (
            <NumberField
              key={field.id}
              field={field}
              value={value}
              onChange={onChange}
              lang={lang}
            />
          );
        }

        if (field.type === "select") {
          return (
            <SelectField
              key={field.id}
              field={field}
              value={value}
              onChange={onChange}
              lang={lang}
            />
          );
        }

        if (field.type === "toggle") {
          return (
            <ToggleField
              key={field.id}
              field={field}
              value={value}
              onChange={onChange}
              lang={lang}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
