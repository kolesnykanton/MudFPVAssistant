import { useEffect, useRef, useState } from 'react';

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// Queried once at module load — the media query result doesn't change at runtime
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    // Reset animation when target changes (e.g. data loads after skeleton)
    if (prevTargetRef.current !== target) {
      prevTargetRef.current = target;
      startRef.current = null;
      setValue(0);
    }

    if (target === 0) return;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
