import * as p1 from "./posts/pierscionek-zareczynowy.jsx";
import * as p2 from "./posts/druk-3d-krok-po-kroku.jsx";
import * as p3 from "./posts/grawerowanie-laserowe.jsx";
import * as p4 from "./posts/jak-dbac-o-bizuterie.jsx";
import * as p5 from "./posts/odlewy-zywiczne-poradnik.jsx";
import * as p6 from "./posts/prezenty-personalizowane.jsx";
import * as p7 from "./posts/jak-przygotowac-plik-stl.jsx";
import * as p8 from "./posts/srebro-vs-zloto.jsx";

export const POSTS = [
  { ...p1.meta, Body: p1.Body },
  { ...p2.meta, Body: p2.Body },
  { ...p3.meta, Body: p3.Body },
  { ...p4.meta, Body: p4.Body },
  { ...p5.meta, Body: p5.Body },
  { ...p6.meta, Body: p6.Body },
  { ...p7.meta, Body: p7.Body },
  { ...p8.meta, Body: p8.Body },
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
