import { useEffect, useRef } from 'react';
import { Box } from '@mantine/core';
import animationData from '../assets/RC_Sticks_Animation.json';

const SEGMENTS: Record<string, [number, number]> = {
  up_left:      [0,   20],
  up_center:    [30,  50],
  up_right:     [60,  80],
  down_left:    [90,  110],
  down_center:  [120, 140],
  down_right:   [150, 170],
  center_right: [180, 200],
  center_left:  [210, 230],
};

interface Props {
  segment: string;
}

export default function StickAnimation({ segment }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null);
  const directionRef = useRef(1);
  const segRef = useRef<[number, number]>(SEGMENTS[segment] || [0, 20]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lottie = (window as any).lottie;
    if (!containerRef.current || !lottie) return;

    const seg = SEGMENTS[segment] || [0, 20];
    segRef.current = seg;
    directionRef.current = 1;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData,
    });
    animRef.current = anim;

    anim.addEventListener('DOMLoaded', () => {
      anim.playSegments(seg, true);
      const svg = containerRef.current?.querySelector('svg');
      if (svg) {
        svg.querySelectorAll('[fill]').forEach((el: Element) => {
          const f = (el.getAttribute('fill') || '').trim().toLowerCase();
          if (f === '#ffffff' || f === 'white') el.setAttribute('fill', '#5c5c5c');
        });
        svg.querySelectorAll('[stroke]').forEach((el: Element) => {
          const s = (el.getAttribute('stroke') || '').trim().toLowerCase();
          if (s === '#ffffff' || s === 'white') el.setAttribute('stroke', '#5c5c5c');
        });
      }
    });

    anim.addEventListener('complete', () => {
      directionRef.current *= -1;
      anim.setDirection(directionRef.current);
      const nextSeg: [number, number] = directionRef.current > 0
        ? segRef.current
        : [segRef.current[1], segRef.current[0]];
      anim.playSegments(nextSeg, true);
    });

    return () => { anim.destroy(); };
  }, [segment]);

  return (
    <Box
      ref={containerRef}
      style={{ width: '100%', maxWidth: 120, aspectRatio: '1/1' }}
    />
  );
}
