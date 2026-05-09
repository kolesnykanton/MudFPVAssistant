import type { FlightInfo } from '../types';

// 4 drones × a mix of packs. Spread over the last ~3 months.
const SEED_FLIGHTS: Omit<FlightInfo, 'id'>[] = [
  // --- Geprc Mark4 5" (6S LiPo freestyle) ---
  {
    name: 'Geprc Mark4 5"',
    batType: 'LiPo', cellCount: 6, usedMah: 1480,
    flightTime: '04:22', date: '2026-02-16',
    location: 'Old airfield', comment: 'Windy, kept it low',
  },
  {
    name: 'Geprc Mark4 5"',
    batType: 'LiPo', cellCount: 6, usedMah: 1510,
    flightTime: '04:47', date: '2026-02-16',
    location: 'Old airfield',
  },
  {
    name: 'Geprc Mark4 5"',
    batType: 'LiPo', cellCount: 6, usedMah: 1395,
    flightTime: '04:05', date: '2026-03-08',
    location: 'Forest clearing', comment: 'Aggressive freestyle, pack ran hot',
  },
  {
    name: 'Geprc Mark4 5"',
    batType: 'LiPo', cellCount: 6, usedMah: 1520,
    flightTime: '04:51', date: '2026-04-03',
    location: 'Local field — Poznyaky',
  },
  {
    name: 'Geprc Mark4 5"',
    batType: 'LiPo', cellCount: 6, usedMah: 1488,
    flightTime: '04:33', date: '2026-05-01',
    location: 'Local field — Poznyaky', comment: 'Maiden on new motors — smooth',
  },

  // --- iFlight Titan XL5 (4S LiPo mid-range) ---
  {
    name: 'iFlight Titan XL5',
    batType: 'LiPo', cellCount: 4, usedMah: 1290,
    flightTime: '05:12', date: '2026-02-28',
    location: 'Riverside park',
  },
  {
    name: 'iFlight Titan XL5',
    batType: 'LiPo', cellCount: 4, usedMah: 1310,
    flightTime: '05:08', date: '2026-02-28',
    location: 'Riverside park', comment: 'Second pack, calmer wind',
  },
  {
    name: 'iFlight Titan XL5',
    batType: 'LiPo', cellCount: 4, usedMah: 1275,
    flightTime: '05:30', date: '2026-03-22',
    location: 'Old airfield', comment: 'Testing new PIDs',
  },
  {
    name: 'iFlight Titan XL5',
    batType: 'LiPo', cellCount: 4, usedMah: 1340,
    flightTime: '05:03', date: '2026-04-19',
    location: 'Local field — Poznyaky',
  },

  // --- BetaFPV 95X V3 (4S micro) ---
  {
    name: 'BetaFPV 95X V3',
    batType: 'LiPo', cellCount: 4, usedMah: 620,
    flightTime: '03:05', date: '2026-03-01',
    location: 'Rooftop freestyle spot',
  },
  {
    name: 'BetaFPV 95X V3',
    batType: 'LiPo', cellCount: 4, usedMah: 645,
    flightTime: '03:11', date: '2026-03-01',
    location: 'Rooftop freestyle spot', comment: 'Pack 2 — gap practice',
  },
  {
    name: 'BetaFPV 95X V3',
    batType: 'LiPo', cellCount: 4, usedMah: 608,
    flightTime: '02:58', date: '2026-04-10',
    location: 'Forest clearing', comment: 'Tree gate session',
  },

  // --- iFlight Chimera7 Pro (4S LiIon long-range) ---
  {
    name: 'iFlight Chimera7 Pro',
    batType: 'LiIon', cellCount: 4, usedMah: 2850,
    flightTime: '18:40', date: '2026-03-15',
    location: 'Riverside park', comment: 'Slow cruise, ~2 km out',
  },
  {
    name: 'iFlight Chimera7 Pro',
    batType: 'LiIon', cellCount: 4, usedMah: 2910,
    flightTime: '19:05', date: '2026-04-27',
    location: 'Old airfield', comment: 'Low-level mapping pass',
  },
  {
    name: 'iFlight Chimera7 Pro',
    batType: 'LiIon', cellCount: 4, usedMah: 2780,
    flightTime: '17:55', date: '2026-05-04',
    location: 'Forest clearing', comment: 'Windy — cut short at 3S sag',
  },
];

export default SEED_FLIGHTS;
