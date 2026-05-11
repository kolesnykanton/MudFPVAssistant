/**
 * Flight test-data generator.
 *
 * Run with:
 *   npx tsx src/dev/generateFlightData.ts
 *
 * Outputs: src/dev/test-flights.json
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

type BatteryType = 'LiPo' | 'LiIon';

interface FlightInfo {
  name: string;
  date: string;       // ISO date string, e.g. "2025-03-14"
  usedMah: number;
  flightTime: string; // "mm:ss"
  location: string;
  comment?: string;
  batType: BatteryType;
  cellCount: number;
}

// ─── Drone profiles ───────────────────────────────────────────────────────────

interface DroneProfile {
  name: string;
  batType: BatteryType;
  cellCount: number;
  mahRange: [number, number];   // typical mAh per flight
  timeRange: [number, number];  // typical flight time in seconds
  locations: string[];
  commentPool: string[];
}

const DRONES: DroneProfile[] = [
  {
    name: 'iFlight Nazgul 5',
    batType: 'LiPo',
    cellCount: 6,
    mahRange: [1400, 2200],
    timeRange: [4 * 60, 8 * 60],
    locations: ['Race Circuit', 'Industrial Zone', 'Abandoned Factory', 'Quarry'],
    commentPool: [
      'Smooth freestyle run',
      'Tried new tune, needs PIDs',
      'Great conditions, minimal wind',
      'Motor 3 getting hot',
      'Props hit trees, minor damage',
      '',
    ],
  },
  {
    name: 'BetaFPV Cetus X',
    batType: 'LiPo',
    cellCount: 4,
    mahRange: [850, 1300],
    timeRange: [6 * 60, 12 * 60],
    locations: ['Local Park', 'School Field', 'Backyard', 'Parking Lot'],
    commentPool: [
      'Beginner-friendly session',
      'Practiced hovering and circuits',
      'Wind picking up, called it early',
      'Clean flight, great visibility',
      'Tried FPV goggles for the first time',
      '',
    ],
  },
  {
    name: 'DJI FPV',
    batType: 'LiIon',
    cellCount: 6,
    mahRange: [2100, 2800],
    timeRange: [10 * 60, 22 * 60],
    locations: ['Mountain Ridge', 'Coastal Cliffs', 'City Skyline', 'National Park', 'Forest Trail'],
    commentPool: [
      'Cinematic cruise, zero issues',
      'Captured sunset footage',
      'GPS signal weak near tower',
      'Manual mode only, great run',
      'OSD data looked perfect',
      '',
    ],
  },
  {
    name: 'Geprc Mark5 HD',
    batType: 'LiPo',
    cellCount: 4,
    mahRange: [1100, 1800],
    timeRange: [5 * 60, 10 * 60],
    locations: ['Dirt Track', 'Skate Park', 'Beach Access Road', 'Rooftop'],
    commentPool: [
      'Rolls and flips session',
      'Nearly clipped the wall',
      'Props out of balance — changed',
      'Full punch-out test',
      'HD footage came out crisp',
      '',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[rnd(0, arr.length - 1)];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function formatFlightTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Generation logic ─────────────────────────────────────────────────────────

const START = new Date('2025-01-01');
const END   = new Date('2026-05-11');
const TOTAL_DAYS = Math.ceil((END.getTime() - START.getTime()) / 86_400_000);

function shouldFlyToday(d: Date, activityBias: number): boolean {
  const dow = d.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6;
  // Higher chance on weekends, modulated by season
  const month = d.getMonth(); // 0–11
  // Peak season Apr–Sep (months 3–8)
  const seasonBoost = month >= 3 && month <= 8 ? 1.0 : 0.45;
  const base = isWeekend ? 0.25 : 0.06;
  return Math.random() < base * seasonBoost * activityBias;
}

function flightsOnDay(drone: DroneProfile): number {
  // 1–4 battery packs per outing, weighted low
  const weights = [0, 45, 30, 15, 10]; // index = count
  const r = rnd(0, 99);
  let acc = 0;
  for (let i = 1; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return 1;
}

function generateFlight(drone: DroneProfile, date: Date): FlightInfo {
  const mahVariance = rnd(-150, 150);
  const rawMah = rnd(drone.mahRange[0], drone.mahRange[1]) + mahVariance;
  const usedMah = Math.max(500, rawMah);

  const rawSec = rnd(drone.timeRange[0], drone.timeRange[1]);
  // Add slight variance per-flight
  const seconds = Math.max(60, rawSec + rnd(-60, 60));

  return {
    name: drone.name,
    date: toISO(date),
    usedMah,
    flightTime: formatFlightTime(seconds),
    location: pick(drone.locations),
    batType: drone.batType,
    cellCount: drone.cellCount,
    ...(pick(drone.commentPool) ? { comment: pick(drone.commentPool) } : {}),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const flights: FlightInfo[] = [];

// Each drone has its own activity level so the dataset has character
const activityBias: number[] = DRONES.map(() => 0.7 + Math.random() * 0.6);

for (let day = 0; day <= TOTAL_DAYS; day++) {
  const date = addDays(START, day);
  if (date > END) break;

  DRONES.forEach((drone, i) => {
    if (!shouldFlyToday(date, activityBias[i])) return;

    const count = flightsOnDay(drone);
    for (let f = 0; f < count; f++) {
      flights.push(generateFlight(drone, date));
    }
  });
}

// Shuffle so import order is mixed (more realistic)
for (let i = flights.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [flights[i], flights[j]] = [flights[j], flights[i]];
}

const outPath = join(import.meta.dirname ?? __dirname, 'test-flights.json');
writeFileSync(outPath, JSON.stringify(flights, null, 2));

console.log(`✓ Generated ${flights.length} flights across ${TOTAL_DAYS + 1} days`);
console.log(`  Date range : ${toISO(START)} → ${toISO(END)}`);
console.log(`  Drones     : ${DRONES.map(d => d.name).join(', ')}`);
console.log(`  Written to : ${outPath}`);
