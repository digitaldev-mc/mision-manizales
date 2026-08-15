"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const nav = document.getElementById("site-nav");
    const bar = document.getElementById("scroll-progress");

    function onScroll() {
      const st = window.scrollY || document.documentElement.scrollTop;
      nav?.classList.toggle("scrolled", st > 8);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) {
        bar.style.width = `${h > 0 ? Math.min(100, (st / h) * 100) : 0}%`;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);
}

export function animateCount(
  el: HTMLElement | null,
  to: number,
  prefix = "",
  onDone?: () => void,
) {
  if (!el) return;
  const from = 0;
  const dur = 1200;
  const t0 = performance.now();

  function step(t: number) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = from + (to - from) * eased;
    el!.textContent = prefix + Math.round(val).toLocaleString("es-CO");
    if (p < 1) requestAnimationFrame(step);
    else onDone?.();
  }

  requestAnimationFrame(step);
}
