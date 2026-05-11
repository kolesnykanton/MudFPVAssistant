import { useMemo } from 'react';
import { Box, Group, Grid, Paper, Text, Title, VisuallyHidden } from '@mantine/core';
import {
  LineChart, Line, BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FlightInfo } from '../types';
import { parseFlightTimeSeconds, secondsToMmSs } from '../utils/flightTime';

interface FlightStatsProps {
  flights: FlightInfo[];
}

const tooltipStyle = {
  backgroundColor: 'var(--mantine-color-dark-7)',
  border: '1px solid var(--mantine-color-dark-4)',
  borderRadius: 6,
  color: 'var(--mantine-color-gray-1)',
  fontSize: 12,
} as const;

const axisTickStyle = { fill: 'var(--mantine-color-gray-5)', fontSize: 11 } as const;
const gridStroke = 'rgba(255,255,255,0.07)';

const BAT_COLORS: Record<string, string> = {
  LiPo: 'var(--mantine-color-orange-5)',
  LiIon: 'var(--mantine-color-blue-5)',
  Unknown: 'var(--mantine-color-gray-5)',
};

const CELL_PALETTE = [
  'var(--mantine-color-grape-4)',
  'var(--mantine-color-violet-4)',
  'var(--mantine-color-blue-4)',
  'var(--mantine-color-cyan-4)',
  'var(--mantine-color-teal-4)',
  'var(--mantine-color-green-4)',
  'var(--mantine-color-lime-4)',
  'var(--mantine-color-yellow-4)',
];

function secsToHhMmSs(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FlightStats({ flights }: FlightStatsProps) {
  // Pass 1: single loop over flights — builds all aggregation maps
  const statsBundle = useMemo(() => {
    const mahByDay: Record<string, number> = {};
    const batTypeCounts: Record<string, number> = {};
    const cellCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const droneTimeSums: Record<string, number> = {};
    const droneTimeCounts: Record<string, number> = {};
    let totalFlightsSecs = 0;
    let totalMah = 0;

    for (const f of flights) {
      if (f.date && f.usedMah != null) {
        mahByDay[f.date] = (mahByDay[f.date] ?? 0) + f.usedMah;
        totalMah += f.usedMah;
      }
      const t = f.batType ?? 'Unknown';
      batTypeCounts[t] = (batTypeCounts[t] ?? 0) + 1;
      if (f.cellCount > 0) {
        const cell = `${f.cellCount}S`;
        cellCounts[cell] = (cellCounts[cell] ?? 0) + 1;
      }
      if (f.location) locationCounts[f.location] = (locationCounts[f.location] ?? 0) + 1;
      if (f.name && f.flightTime) {
        const secs = parseFlightTimeSeconds(f.flightTime);
        if (secs !== null) {
          droneTimeSums[f.name] = (droneTimeSums[f.name] ?? 0) + secs;
          droneTimeCounts[f.name] = (droneTimeCounts[f.name] ?? 0) + 1;
          totalFlightsSecs += secs;
        }
      }
    }
    return { mahByDay, batTypeCounts, cellCounts, locationCounts, droneTimeSums, droneTimeCounts, totalMah, totalFlightsSecs };
  }, [flights]);

  // Pass 2: shape maps into chart-ready arrays (iterates only small derived maps)
  const chartData = useMemo(() => {
    const { mahByDay, batTypeCounts, cellCounts, locationCounts, droneTimeSums, droneTimeCounts } = statsBundle;

    const dailyMah = Object.entries(mahByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, mah]) => ({ date: date.slice(5), mah }));

    const batteryType = Object.entries(batTypeCounts)
      .map(([name, value]) => ({ name, value }));

    const cellCountBar = Object.entries(cellCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([name, value]) => ({ name, value }));

    const sortedLocs = Object.entries(locationCounts).sort(([, a], [, b]) => b - a);
    const topLocs = sortedLocs.slice(0, 12).map(([name, value]) => ({ name, value }));
    if (sortedLocs.length > 12) {
      topLocs.push({ name: 'Other', value: sortedLocs.slice(12).reduce((s, [, v]) => s + v, 0) });
    }

    const droneAvgTime = Object.entries(droneTimeSums)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sum]) => {
        const count = droneTimeCounts[name] ?? 1;
        const avg = Math.round(sum / count);
        return { name, avgSeconds: avg, label: secondsToMmSs(avg) };
      });

    return { dailyMah, batteryType, cellCountBar, topLocs, droneAvgTime };
  }, [statsBundle]);

  if (flights.length === 0) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Text c="dimmed">No flight data to display charts.</Text>
      </Paper>
    );
  }

  const { totalMah, totalFlightsSecs, locationCounts, droneTimeSums } = statsBundle;
  const { dailyMah, batteryType, cellCountBar, topLocs, droneAvgTime } = chartData;

  const summaryStats = [
    { label: 'Total Flights', value: String(flights.length), color: 'var(--mantine-color-blue-4)' },
    { label: 'Total mAh', value: totalMah > 0 ? `${totalMah.toLocaleString()} mAh` : '—', color: 'var(--mantine-color-cyan-4)' },
    { label: 'Air Time', value: totalFlightsSecs > 0 ? secsToHhMmSs(totalFlightsSecs) : '—', color: 'var(--mantine-color-teal-4)' },
    { label: 'Locations', value: String(Object.keys(locationCounts).length), color: 'var(--mantine-color-indigo-4)' },
    { label: 'Drones', value: String(Object.keys(droneTimeSums).length), color: 'var(--mantine-color-violet-4)' },
  ];

  const locBarHeight = Math.min(520, Math.max(200, topLocs.length * 38));
  const cellBarHeight = Math.min(400, Math.max(160, cellCountBar.length * 44));

  return (
    <Box>
      {/* Summary stats bar */}
      <Group gap="sm" mb="lg" wrap="wrap">
        {summaryStats.map(stat => (
          <Paper
            key={stat.label}
            withBorder px="md" py="xs" radius="sm"
            style={{ flex: '1 1 130px', minWidth: 110 }}
          >
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: 1 }}>{stat.label}</Text>
            <Text size="xl" fw={700} style={{ color: stat.color, fontFamily: 'monospace' }}>{stat.value}</Text>
          </Paper>
        ))}
      </Group>

      <Grid gap="lg">
        {/* Chart 1: mAh per day */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Title order={5} mb="sm" component="figcaption">1. Total mAh per Day (last 15 days)</Title>
            {dailyMah.length === 0 ? (
              <Text c="dimmed">No mAh data available.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Line chart of total mAh used per day over the last {dailyMah.length} day(s) with data.
                </VisuallyHidden>
                <ResponsiveContainer width="100%" height={280} debounce={100}>
                  <LineChart data={dailyMah} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} mAh`, 'Total mAh']} />
                    <Line
                      type="monotone"
                      dataKey="mah"
                      name="Total mAh"
                      stroke="var(--mantine-color-cyan-5)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--mantine-color-cyan-5)', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 2: Battery type donut */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Title order={5} mb="sm" component="figcaption">2. Flights by Battery Type</Title>
            {batteryType.length === 0 ? (
              <Text c="dimmed">No data.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Donut chart of flight count by battery type. {batteryType.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </VisuallyHidden>
                <Box style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={260} debounce={100}>
                    <PieChart>
                      <Pie
                        data={batteryType}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                      >
                        {batteryType.map((entry, i) => (
                          <Cell key={i} fill={BAT_COLORS[entry.name] ?? CELL_PALETTE[i % CELL_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -62%)',
                      textAlign: 'center', pointerEvents: 'none',
                    }}
                  >
                    <Text size="xl" fw={700} style={{ fontFamily: 'monospace' }}>{flights.length}</Text>
                    <Text size="xs" c="dimmed">flights</Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 3: Cell count horizontal bar */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Title order={5} mb="sm" component="figcaption">3. Flights by Cell Count</Title>
            {cellCountBar.length === 0 ? (
              <Text c="dimmed">No cell count data.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Horizontal bar chart of flight count by battery cell count. {cellCountBar.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </VisuallyHidden>
                <Box style={{ height: cellBarHeight }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <BarChart layout="vertical" data={cellCountBar} margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} />
                      <YAxis type="category" dataKey="name" width={40} tick={axisTickStyle} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} flights`, 'Count']} />
                      <Bar dataKey="value" name="Flights" radius={[0, 4, 4, 0]}>
                        {cellCountBar.map((_, i) => (
                          <Cell key={i} fill={CELL_PALETTE[i % CELL_PALETTE.length]} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          style={{ fill: 'var(--mantine-color-gray-3)', fontSize: 11 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 4: Average flight time per drone */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Title order={5} mb="sm" component="figcaption">4. Average Flight Time per Drone (mm:ss)</Title>
            {droneAvgTime.length === 0 ? (
              <Text c="dimmed">No flight time data available.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Bar chart of average flight time per drone in mm:ss. {droneAvgTime.map(d => `${d.name}: ${d.label}`).join(', ')}.
                </VisuallyHidden>
                <ResponsiveContainer width="100%" height={320} debounce={100}>
                  <BarChart data={droneAvgTime} margin={{ top: 24, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="name"
                      tick={axisTickStyle}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v: number) => secondsToMmSs(v)}
                      tick={axisTickStyle}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: unknown) => [secondsToMmSs(typeof value === 'number' ? value : 0), 'Avg Time']}
                    />
                    <Bar dataKey="avgSeconds" name="Avg Flight Time" fill="var(--mantine-color-teal-5)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="label"
                        position="top"
                        style={{ fill: 'var(--mantine-color-gray-3)', fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 5: Top locations horizontal bar (replaces pie) */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Title order={5} mb="sm" component="figcaption">5. Top Locations by Flight Count</Title>
            {topLocs.length === 0 ? (
              <Text c="dimmed">No location data.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Horizontal bar chart of top locations by flight count. {topLocs.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </VisuallyHidden>
                <Box style={{ height: locBarHeight }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <BarChart layout="vertical" data={topLocs} margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{ ...axisTickStyle, width: 145 }}
                        tickFormatter={(v: string) => v.length > 22 ? `${v.slice(0, 21)}…` : v}
                      />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} flights`, 'Count']} />
                      <Bar dataKey="value" name="Flights" fill="var(--mantine-color-indigo-4)" radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="value"
                          position="right"
                          style={{ fill: 'var(--mantine-color-gray-3)', fontSize: 11 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
