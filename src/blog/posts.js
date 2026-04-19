import * as p1 from "./posts/pierscionek-zareczynowy.jsx";
import * as p2 from "./posts/druk-3d-krok-po-kroku.jsx";
import * as p3 from "./posts/grawerowanie-laserowe.jsx";

export const POSTS = [
  { ...p1.meta, Body: p1.Body },
  { ...p2.meta, Body: p2.Body },
  { ...p3.meta, Body: p3.Body },
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
