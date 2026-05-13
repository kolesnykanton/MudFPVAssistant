import { useMemo } from 'react';
import { Box, Group, Grid, Paper, Text, Title, VisuallyHidden, useComputedColorScheme } from '@mantine/core';
import {
  AreaChart, Area, BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
  IconPlane, IconBolt, IconClock, IconMapPin, IconDrone,
  IconBattery2, IconTrophy, IconFlame, IconActivity,
} from '@tabler/icons-react';
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

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const week = Math.floor(dayOfYear / 7) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

type HeatmapValue = { date: string; count: number };

interface StatCard {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

export default function FlightStats({ flights }: FlightStatsProps) {
  const colorScheme = useComputedColorScheme('light');
  const gridStroke = colorScheme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const barCursor = { fill: colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' };

  // Pass 1: single loop — builds all aggregation maps
  const statsBundle = useMemo(() => {
    const mahByDay: Record<string, number> = {};
    const batTypeCounts: Record<string, number> = {};
    const cellCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const droneTimeSums: Record<string, number> = {};
    const droneTimeCounts: Record<string, number> = {};
    const flightsByDay: Record<string, number> = {};
    const flightsByWeek: Record<string, number> = {};
    let totalFlightsSecs = 0;
    let totalMah = 0;
    let longestFlightSecs = 0;

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
          if (secs > longestFlightSecs) longestFlightSecs = secs;
        }
      }
      if (f.date) {
        flightsByDay[f.date] = (flightsByDay[f.date] ?? 0) + 1;
        const weekKey = getWeekKey(f.date);
        flightsByWeek[weekKey] = (flightsByWeek[weekKey] ?? 0) + 1;
      }
    }
    return {
      mahByDay, batTypeCounts, cellCounts, locationCounts,
      droneTimeSums, droneTimeCounts, flightsByDay, flightsByWeek,
      totalMah, totalFlightsSecs, longestFlightSecs,
    };
  }, [flights]);

  // Pass 2: shape maps into chart-ready arrays
  const chartData = useMemo(() => {
    const { mahByDay, batTypeCounts, cellCounts, locationCounts, droneTimeSums, droneTimeCounts, flightsByDay, flightsByWeek } = statsBundle;

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
    const totalLocFlights = sortedLocs.reduce((s, [, v]) => s + v, 0);
    const topLocs = sortedLocs.slice(0, 12).map(([name, value]) => ({
      name,
      value,
      pct: `${Math.round((value / totalLocFlights) * 100)}%`,
    }));
    if (sortedLocs.length > 12) {
      const otherVal = sortedLocs.slice(12).reduce((s, [, v]) => s + v, 0);
      topLocs.push({
        name: 'Other',
        value: otherVal,
        pct: `${Math.round((otherVal / totalLocFlights) * 100)}%`,
      });
    }

    const droneAvgTime = Object.entries(droneTimeSums)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sum]) => {
        const count = droneTimeCounts[name] ?? 1;
        const avg = Math.round(sum / count);
        return { name, avgSeconds: avg, label: secondsToMmSs(avg) };
      });

    const heatmapValues: HeatmapValue[] = Object.entries(flightsByDay)
      .map(([date, count]) => ({ date, count }));

    const weeklyTrend = Object.keys(flightsByWeek).sort().slice(-12)
      .map(week => ({ week: week.replace(/^\d{4}-/, ''), flights: flightsByWeek[week] }));

    return { dailyMah, batteryType, cellCountBar, topLocs, droneAvgTime, heatmapValues, weeklyTrend };
  }, [statsBundle]);

  // Derived KPIs from statsBundle
  const extendedKpis = useMemo(() => {
    const { flightsByDay, totalMah, longestFlightSecs } = statsBundle;
    const avgMah = flights.length > 0 && totalMah > 0 ? Math.round(totalMah / flights.length) : null;
    const bestDay = Object.values(flightsByDay).length > 0 ? Math.max(...Object.values(flightsByDay)) : 0;
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (flightsByDay[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return { avgMah, bestDay, longestFlightSecs, streak };
  }, [statsBundle, flights.length]);

  if (flights.length === 0) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Text c="dimmed">No flight data to display charts.</Text>
      </Paper>
    );
  }

  const { totalMah, totalFlightsSecs, locationCounts, droneTimeSums } = statsBundle;
  const { dailyMah, batteryType, cellCountBar, topLocs, droneAvgTime, heatmapValues, weeklyTrend } = chartData;

  const summaryCards: StatCard[] = [
    { label: 'Total Flights', value: String(flights.length), color: 'var(--mantine-color-blue-4)', icon: IconPlane },
    { label: 'Total mAh', value: totalMah > 0 ? `${totalMah.toLocaleString()} mAh` : '—', color: 'var(--mantine-color-cyan-4)', icon: IconBolt },
    { label: 'Air Time', value: totalFlightsSecs > 0 ? secsToHhMmSs(totalFlightsSecs) : '—', color: 'var(--mantine-color-teal-4)', icon: IconClock },
    { label: 'Locations', value: String(Object.keys(locationCounts).length), color: 'var(--mantine-color-indigo-4)', icon: IconMapPin },
    { label: 'Drones', value: String(Object.keys(droneTimeSums).length), color: 'var(--mantine-color-violet-4)', icon: IconDrone },
    { label: 'Avg mAh', value: extendedKpis.avgMah != null ? `${extendedKpis.avgMah} mAh` : '—', color: 'var(--mantine-color-orange-4)', icon: IconBattery2 },
    { label: 'Longest', value: extendedKpis.longestFlightSecs > 0 ? secsToHhMmSs(extendedKpis.longestFlightSecs) : '—', color: 'var(--mantine-color-yellow-4)', icon: IconTrophy },
    { label: 'Best Day', value: extendedKpis.bestDay > 0 ? `${extendedKpis.bestDay} flights` : '—', color: 'var(--mantine-color-red-4)', icon: IconFlame },
    { label: 'Streak', value: extendedKpis.streak > 0 ? `${extendedKpis.streak} days` : '—', color: 'var(--mantine-color-lime-4)', icon: IconActivity },
  ];

  const locBarHeight = Math.min(520, Math.max(200, topLocs.length * 38));
  const cellBarHeight = Math.min(400, Math.max(160, cellCountBar.length * 44));

  const heatmapEnd = new Date();
  const heatmapStart = new Date();
  heatmapStart.setFullYear(heatmapEnd.getFullYear() - 1);

  return (
    <Box>
      {/* Summary KPI cards */}
      <Group gap="sm" mb="lg" wrap="wrap">
        {summaryCards.map(stat => (
          <Paper
            key={stat.label}
            withBorder px="md" py="sm" radius="sm"
            style={{ flex: '1 1 150px', minWidth: 130, borderLeft: `3px solid ${stat.color}` }}
          >
            <Group gap="xs" mb={4} align="center">
              <stat.icon size={14} style={{ color: stat.color, flexShrink: 0 }} />
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.08em' }}>
                {stat.label}
              </Text>
            </Group>
            <Text size="xl" fw={800} style={{ color: stat.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {stat.value}
            </Text>
          </Paper>
        ))}
      </Group>

      <Grid gap="lg">
        {/* Activity Calendar Heatmap */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-blue-6)' }} component="figcaption">
              <Title order={5}>Flying Year</Title>
            </Box>
            <VisuallyHidden>
              Activity calendar showing flights per day over the last year. {heatmapValues.length} days with recorded flights.
            </VisuallyHidden>
            <Box style={{ overflowX: 'auto' }}>
              <CalendarHeatmap
                startDate={heatmapStart}
                endDate={heatmapEnd}
                values={heatmapValues}
                classForValue={(value) => {
                  const v = value as HeatmapValue | undefined;
                  if (!v || v.count === 0) return 'color-empty';
                  if (v.count === 1) return 'color-scale-1';
                  if (v.count === 2) return 'color-scale-2';
                  if (v.count <= 4) return 'color-scale-3';
                  return 'color-scale-4';
                }}
                showWeekdayLabels
              />
            </Box>
          </Paper>
        </Grid.Col>

        {/* Chart 1: mAh per day — AreaChart with gradient */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-cyan-6)' }} component="figcaption">
              <Title order={5}>Total mAh per Day (last 15 days)</Title>
            </Box>
            {dailyMah.length === 0 ? (
              <Text c="dimmed">No mAh data available.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Area chart of total mAh used per day over the last {dailyMah.length} day(s) with data.
                </VisuallyHidden>
                <ResponsiveContainer width="100%" height={280} debounce={100}>
                  <AreaChart data={dailyMah} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="mahGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mantine-color-cyan-5)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--mantine-color-cyan-5)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} mAh`, 'Total mAh']} />
                    <Area
                      type="monotone"
                      dataKey="mah"
                      name="Total mAh"
                      stroke="var(--mantine-color-cyan-5)"
                      strokeWidth={2}
                      fill="url(#mahGradient)"
                      dot={{ r: 3, fill: 'var(--mantine-color-cyan-5)', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 2: Battery type donut */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-orange-6)' }} component="figcaption">
              <Title order={5}>Flights by Battery Type</Title>
            </Box>
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
                    <Text size="xl" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{flights.length}</Text>
                    <Text size="xs" c="dimmed">flights</Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart: Weekly trend */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-violet-6)' }} component="figcaption">
              <Title order={5}>Weekly Activity (last 12 weeks)</Title>
            </Box>
            {weeklyTrend.length < 4 ? (
              <Text c="dimmed" size="sm">Not enough data yet (need 4+ weeks).</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Area chart of flights per week for the last {weeklyTrend.length} weeks.
                </VisuallyHidden>
                <ResponsiveContainer width="100%" height={200} debounce={100}>
                  <AreaChart data={weeklyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mantine-color-violet-5)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--mantine-color-violet-5)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="week" tick={axisTickStyle} />
                    <YAxis tick={axisTickStyle} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}`, 'Flights']} />
                    <Area
                      type="monotone"
                      dataKey="flights"
                      stroke="var(--mantine-color-violet-5)"
                      strokeWidth={2}
                      fill="url(#weekGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        {/* Chart 3: Cell count horizontal bar */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-violet-6)' }} component="figcaption">
              <Title order={5}>Flights by Cell Count</Title>
            </Box>
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
                      <Tooltip contentStyle={tooltipStyle} cursor={barCursor} formatter={(v: unknown) => [`${v} flights`, 'Count']} />
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
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-teal-6)' }} component="figcaption">
              <Title order={5}>Avg Flight Time per Drone</Title>
            </Box>
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
                      cursor={barCursor}
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

        {/* Chart 5: Top locations horizontal bar with % */}
        <Grid.Col span={{ base: 12 }}>
          <Paper withBorder p="md" radius="md" component="figure" m={0}>
            <Box mb="sm" pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-indigo-6)' }} component="figcaption">
              <Title order={5}>Top Locations by Flight Count</Title>
            </Box>
            {topLocs.length === 0 ? (
              <Text c="dimmed">No location data.</Text>
            ) : (
              <Box>
                <VisuallyHidden>
                  Horizontal bar chart of top locations by flight count. {topLocs.map(d => `${d.name}: ${d.value}`).join(', ')}.
                </VisuallyHidden>
                <Box style={{ height: locBarHeight }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <BarChart layout="vertical" data={topLocs} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={axisTickStyle} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{ ...axisTickStyle, width: 145 }}
                        tickFormatter={(v: string) => v.length > 22 ? `${v.slice(0, 21)}…` : v}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={barCursor} formatter={(v: unknown) => [`${v} flights`, 'Count']} />
                      <Bar dataKey="value" name="Flights" fill="var(--mantine-color-indigo-4)" radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="pct"
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
