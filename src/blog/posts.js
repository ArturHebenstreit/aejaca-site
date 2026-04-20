import * as p1 from "./posts/pierscionek-zareczynowy.jsx";
import * as p2 from "./posts/druk-3d-krok-po-kroku.jsx";
import * as p3 from "./posts/grawerowanie-laserowe.jsx";
import * as p4 from "./posts/jak-dbac-o-bizuterie.jsx";
import * as p5 from "./posts/odlewy-zywiczne-poradnik.jsx";
import * as p6 from "./posts/prezenty-personalizowane.jsx";
import * as p7 from "./posts/jak-przygotowac-plik-stl.jsx";
import * as p8 from "./posts/srebro-vs-zloto.jsx";
import * as p9 from "./posts/obraczki-slubne.jsx";
import * as p10 from "./posts/materialy-laser-cutting.jsx";
import * as p11 from "./posts/bizuteria-inwestycja.jsx";
import * as p12 from "./posts/projektowanie-ai.jsx";
import * as p13 from "./posts/warsztat-od-kuchni.jsx";

export const POSTS = [
  { ...p1.meta, Body: p1.Body },
  { ...p2.meta, Body: p2.Body },
  { ...p3.meta, Body: p3.Body },
  { ...p4.meta, Body: p4.Body },
  { ...p5.meta, Body: p5.Body },
  { ...p6.meta, Body: p6.Body },
  { ...p7.meta, Body: p7.Body },
  { ...p8.meta, Body: p8.Body },
  { ...p9.meta, Body: p9.Body },
  { ...p10.meta, Body: p10.Body },
  { ...p11.meta, Body: p11.Body },
  { ...p12.meta, Body: p12.Body },
  { ...p13.meta, Body: p13.Body },
];

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export function getPostsByCategory(category) {
  return POSTS.filter((p) => p.category === category);
}

export function getSortedPosts() {
  return [...POSTS].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}
