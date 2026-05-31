'use client';

import { useEffect } from 'react';

/**
 * Gère les révélations au scroll : tout élément `.reveal` reçoit `.in` quand il
 * entre dans le viewport. Port fidèle du script de la landing (affichage immédiat
 * du above-the-fold, IntersectionObserver pour le reste, fallback à 1.2s).
 * À monter une fois par page qui utilise `.reveal`.
 */
export default function Reveal() {
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    const showIfInView = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh && r.bottom > 0) {
        el.classList.add('in');
        return true;
      }
      return false;
    };
    reveals.forEach(showIfInView);

    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
      );
      reveals.forEach((el) => {
        if (!el.classList.contains('in')) io!.observe(el);
      });
    }

    const t = window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => el.classList.add('in'));
    }, 1200);

    return () => {
      io?.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
