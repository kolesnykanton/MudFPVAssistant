import { useMemo } from 'react';
import { Box, Grid, Paper, Text, Title } from '@mantine/core';
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FlightInfo } from '../types';

interface FlightStatsProps {
  flights: FlightInfo[];
}

const COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#e57373', '#ba68c8',
  '#4db6ac', '#f06292', '#aed581', '#ff8a65', '#90a4ae',
  '#fff176', '#ce93d8', '#80cbc4', '#ef9a9a', '#a5d6a7',
];

/** Parse "mm:ss" → seconds, returns null on failure */
function parseFlightTimeSeconds(ft: string | undefined): number | null {
  if (!ft) return null;
  const parts = ft.split(':');
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return null;
  return mins * 60 + secs;
}

/** Convert seconds back to mm:ss string */
function secondsToMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FlightStats({ flights }: FlightStatsProps) {
  // All hooks must run unconditionally (Rules of Hooks) — early return is below.

  // ── 1. Total mAh per day (last 15 days with data) ──────────────────────────
  const dailyMahData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of flights) {
      if (!f.date || f.usedMah == null) continue;
      map[f.date] = (map[f.date] ?? 0) + f.usedMah;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, mah]) => ({ date, mah }));
  }, [flights]);

  // ── 2. Flights by battery type ──────────────────────────────────────────────
  const batteryTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of flights) {
      const t = f.batType ?? 'Unknown';
      map[t] = (map[t] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [flights]);

  // ── 3. Top 15 locations ─────────────────────────────────────────────────────
  const locationData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of flights) {
      if (!f.location) continue;
      map[f.location] = (map[f.location] ?? 0) + 1;
    }
    const sorted = Object.entries(map)
      .sort(([, a], [, b]) => b - a);

    if (sorted.length <= 15) {
      return sorted.map(([name, value]) => ({ name, value }));
    }
    const top14 = sorted.slice(0, 14);
    const other = sorted.slice(14).reduce((sum, [, v]) => sum + v, 0);
    return [...top14.map(([name, value]) => ({ name, value })), { name: 'Other', value: other }];
  }, [flights]);

  // ── 4. Average flight time per drone ───────────────────────────────────────
  const droneAvgTimeData = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const f of flights) {
      if (!f.name || !f.flightTime) continue;
      const secs = parseFlightTimeSeconds(f.flightTime);
      if (secs === null) continue;
      if (!map[f.name]) map[f.name] = [];
      map[f.name].push(secs);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, times]) => ({
        name,
        avgSeconds: Math.round(times.reduce((s, t) => s + t, 0) / times.length),
        label: secondsToMmSs(Math.round(times.reduce((s, t) => s + t, 0) / times.length)),
      }));
  }, [flights]);

  if (flights.length === 0) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Text c="dimmed">No flight data to display charts.</Text>
      </Paper>
    );
  }

  return (
    <Box>
      <Grid gap="lg">
        {/* Chart 1: mAh per day */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">1. Total mAh per Day (last 15 days)</Title>
            {dailyMahData.length === 0 ? (
              <Text c="dimmed">No mAh data available.</Text>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyMahData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mah"
                      name="Total mAh"
                      stroke="#4fc3f7"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 2: Battery type pie */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">2. Flights by Battery Type</Title>
            {batteryTypeData.length === 0 ? (
              <Text c="dimmed">No data.</Text>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={batteryTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {batteryTypeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 3: Locations pie */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">3. Top Locations by Flight Count</Title>
            {locationData.length === 0 ? (
              <Text c="dimmed">No location data.</Text>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={locationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {locationData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 4: Average flight time per drone */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">4. Average Flight Time per Drone (mm:ss)</Title>
            {droneAvgTimeData.length === 0 ? (
              <Text c="dimmed">No flight time data available.</Text>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={droneAvgTimeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v: number) => secondsToMmSs(v)}
                      label={{ value: 'mm:ss', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [secondsToMmSs(typeof value === 'number' ? value : 0), 'Avg Time']}
                    />
                    <Legend />
                    <Bar dataKey="avgSeconds" name="Avg Flight Time" fill="#81c784" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
