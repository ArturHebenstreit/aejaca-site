import { getProductType } from "./productConfig.js";
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

export default function DimensionInputs({ productTypeId, values, onChange, lang }) {
  const pt = getProductType(productTypeId);
  if (!pt) return null;

  return (
    <div className="space-y-4">
      {pt.fields.map((field) => {
        const value = values[field.id] !== undefined ? values[field.id] : field.default;

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
