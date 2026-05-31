'use client';

import { useEffect } from 'react';

/**
 * "Pétales d'Or" — calque d'ambiance (style A choisi par l'utilisateur).
 * Port React de sama-petals.js : pétales d'or qui tombent + poussière dorée qui
 * monte. z-index:1, pointer-events:none → derrière toute la chrome UI, jamais
 * cliquable. Respecte prefers-reduced-motion. Densité via data-petals sur <body>.
 */
type Density = 'off' | 'low' | 'mid' | 'high';
const PRESETS: Record<Density, [number, number, number]> = {
  off: [0, 0, 0],
  low: [4, 5, 0.22],
  mid: [6, 7, 0.28],
  high: [12, 15, 0.45],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Petals() {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    if (document.querySelector('.sama-petals')) return;

    const key = ((document.body.getAttribute('data-petals') || 'mid').toLowerCase() as Density);
    const [petals, dust, opeak] = PRESETS[key] || PRESETS.mid;
    if (petals === 0) return;

    const layer = document.createElement('div');
    layer.className = 'sama-petals';
    layer.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < petals; i++) {
      const p = document.createElement('span');
      p.className = 'sama-petal p' + (i % 3);
      p.style.left = rand(0, 100).toFixed(1) + '%';
      p.style.animationDelay = rand(-14, 6).toFixed(2) + 's';
      p.style.animationDuration = rand(13, 22).toFixed(2) + 's';
      p.style.setProperty('--s', rand(0.55, 1.2).toFixed(2));
      p.style.setProperty('--dx', Math.round(rand(-45, 75)) + 'px');
      p.style.setProperty('--o', (opeak * rand(0.8, 1)).toFixed(2));
      layer.appendChild(p);
    }
    for (let j = 0; j < dust; j++) {
      const d = document.createElement('span');
      d.className = 'sama-dust';
      d.style.left = rand(0, 100).toFixed(1) + '%';
      d.style.animationDelay = rand(-12, 8).toFixed(2) + 's';
      d.style.animationDuration = rand(10, 17).toFixed(2) + 's';
      d.style.setProperty('--s', rand(0.5, 1.1).toFixed(2));
      layer.appendChild(d);
    }

    document.body.appendChild(layer);
    return () => {
      layer.remove();
    };
  }, []);

  return null;
}
