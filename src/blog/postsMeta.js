// Metadata-only blog post aggregator — for teasers/cards that never render
// a post's Body (Home, Jewelry, Studio, BlogIndex). Importing only `meta`
// (not `Body`) from each post module lets Rollup tree-shake the full
// article JSX out of every chunk that reaches this file. BlogPost.jsx
// still uses ../blog/posts.js, since it's the only page that renders Body.
import { meta as m1 } from "./posts/pierscionek-zareczynowy.meta.js";
import { meta as m2 } from "./posts/druk-3d-krok-po-kroku.meta.js";
import { meta as m3 } from "./posts/grawerowanie-laserowe.meta.js";
import { meta as m4 } from "./posts/jak-dbac-o-bizuterie.meta.js";
import { meta as m5 } from "./posts/odlewy-zywiczne-poradnik.meta.js";
import { meta as m6 } from "./posts/prezenty-personalizowane.meta.js";
import { meta as m7 } from "./posts/jak-przygotowac-plik-stl.meta.js";
import { meta as m8 } from "./posts/srebro-vs-zloto.meta.js";
import { meta as m9 } from "./posts/obraczki-slubne.meta.js";
import { meta as m10 } from "./posts/materialy-laser-cutting.meta.js";
import { meta as m11 } from "./posts/bizuteria-inwestycja.meta.js";
import { meta as m12 } from "./posts/projektowanie-ai.meta.js";
import { meta as m13 } from "./posts/warsztat-od-kuchni.meta.js";
import { meta as m14 } from "./posts/modelowanie-3d-na-zamowienie.meta.js";
import { meta as m15 } from "./posts/ile-kosztuje-bizuteria.meta.js";
import { meta as m16 } from "./posts/rodzaje-splotow-lancuszkow.meta.js";

export const POSTS_META = [
  m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, m16,
];

export function getPostMeta(slug) {
  return POSTS_META.find((p) => p.slug === slug) || null;
}

export function getPostsByCategoryMeta(category) {
  return POSTS_META.filter((p) => p.category === category);
}

export function getSortedPostsMeta() {
  return [...POSTS_META].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}
