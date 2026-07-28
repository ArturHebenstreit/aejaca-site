// ============================================================
// REVIEW COUNT LABEL — plural forms per language
// ------------------------------------------------------------
// Polish needs three forms and English/German two, so a single
// i18n string cannot cover a count that changes over time:
//   1 opinia | 2-4 opinie | 5+ opinii  (12-14 take the "opinii" form)
// Used by every place that prints "<n> opinii" next to a rating.
// ============================================================

export function reviewCountLabel(n, lang) {
  if (lang === "de") return n === 1 ? "1 Bewertung" : `${n} Bewertungen`;
  if (lang === "en") return n === 1 ? "1 review" : `${n} reviews`;

  const last = n % 10;
  const lastTwo = n % 100;
  if (n === 1) return "1 opinia";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} opinie`;
  return `${n} opinii`;
}
