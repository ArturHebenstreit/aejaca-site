import { useEffect, useRef } from "react";

/**
 * IntersectionObserver-based scroll reveal hook.
 * Adds 'data-visible' attribute when element enters viewport.
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.setAttribute("data-visible", "true");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "true");
          observer.unobserve(el);
        }
      },
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return ref;
}

/**
 * Hook that returns a callback ref for multiple elements (e.g., list items).
 * Each element animates in with a staggered delay.
 */
export function useStaggerReveal(staggerMs = 80) {
  const observers = useRef([]);

  useEffect(() => {
    return () => observers.current.forEach((o) => o.disconnect());
  }, []);

  const getRef = (index) => (el) => {
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.setAttribute("data-visible", "true");
      return;
    }

    el.style.transitionDelay = `${index * staggerMs}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "true");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    observers.current.push(observer);
  };

  return getRef;
}
