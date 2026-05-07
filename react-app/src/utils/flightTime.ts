/** Parse "mm:ss" → seconds, returns null on failure */
export function parseFlightTimeSeconds(ft: string | undefined): number | null {
  if (!ft) return null;
  const parts = ft.split(':');
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return null;
  return mins * 60 + secs;
}

/** Convert seconds back to mm:ss string */
export function secondsToMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Pads single-digit minutes: "4:20" → "04:20". Returns undefined for empty input. */
export function normalizeFlightTime(input: string): string | undefined {
  if (!input) return undefined;
  const [m, s] = input.split(':');
  return `${m.padStart(2, '0')}:${s}`;
}
