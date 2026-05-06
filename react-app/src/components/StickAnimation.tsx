import { useEffect, useRef } from 'react';
import { Box } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import lottie from 'lottie-web';
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
  const animRef = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null);
  const directionRef = useRef(1);
  const segRef = useRef<[number, number]>(SEGMENTS[segment] || [0, 20]);
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Replace the animation's white fills with a colour that works in both
    // light and dark modes. Light: dark grey for contrast; Dark: keep near-white.
    const replacementColor = colorScheme === 'dark' ? '#d0d0d0' : '#5c5c5c';

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
        svg.querySelectorAll<Element>('[fill]').forEach(el => {
          const f = el.getAttribute('fill')?.trim().toLowerCase() ?? '';
          if (f === '#ffffff' || f === 'white') el.setAttribute('fill', replacementColor);
        });
        svg.querySelectorAll<Element>('[stroke]').forEach(el => {
          const s = el.getAttribute('stroke')?.trim().toLowerCase() ?? '';
          if (s === '#ffffff' || s === 'white') el.setAttribute('stroke', replacementColor);
        });
      }
    });

    anim.addEventListener('complete', () => {
      directionRef.current *= -1;
      anim.setDirection(directionRef.current as 1 | -1);
      const nextSeg: [number, number] = directionRef.current > 0
        ? segRef.current
        : [segRef.current[1], segRef.current[0]];
      anim.playSegments(nextSeg, true);
    });

    return () => { anim.destroy(); };
  }, [segment, colorScheme]);

  return (
    <Box
      ref={containerRef}
      role="img"
      aria-label={`${segment.replace(/_/g, ' ')} stick movement`}
      style={{ width: '100%', maxWidth: 120, aspectRatio: '1/1' }}
    />
  );
}
