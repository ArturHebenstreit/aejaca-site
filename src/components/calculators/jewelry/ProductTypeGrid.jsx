import { PRODUCT_TYPES, getProductType } from "./productConfig.js";

export default function ProductTypeGrid({ selected, onSelect, lang }) {
  const selectedType = selected ? getProductType(selected) : null;

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {PRODUCT_TYPES.map((pt) => {
          const isSelected = selected === pt.id;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => onSelect(pt.id)}
              className={[
                "flex flex-col items-center gap-2 rounded-xl p-3 border transition-all duration-200",
                isSelected
                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
                  : "border-white/10 bg-transparent text-neutral-300 hover:border-amber-400/30 hover:bg-amber-400/5 cursor-pointer",
              ].join(" ")}
              aria-pressed={isSelected}
              aria-label={pt.label[lang] || pt.label.en}
            >
              <span className="text-3xl leading-none" role="img" aria-hidden="true">
                {pt.icon}
              </span>
              <span
                className={[
                  "text-xs font-medium text-center leading-tight",
                  isSelected ? "text-amber-400" : "text-neutral-300",
                ].join(" ")}
              >
                {pt.label[lang] || pt.label.en}
              </span>
            </button>
          );
        })}
      </div>

      {selectedType && (
        <p className="text-xs text-neutral-400 mt-2 text-center">
          {selectedType.description[lang] || selectedType.description.en}
        </p>
      )}
    </div>
  );
}
