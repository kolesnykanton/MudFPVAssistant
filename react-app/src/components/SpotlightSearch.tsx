import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spotlight } from '@mantine/spotlight';
import type { SpotlightActionData, SpotlightActionGroupData } from '@mantine/spotlight';
import {
  IconHome,
  IconPlaneTilt,
  IconChartBar,
  IconMapPin,
  IconSettings,
  IconTool,
  IconBattery2,
} from '@tabler/icons-react';
import { useData } from '../context/DataContext';

// Hoisted — these never change so they don't need to be recreated inside useMemo
const ICON_HOME     = <IconHome size={18} />;
const ICON_FLIGHTS  = <IconPlaneTilt size={18} />;
const ICON_STATS    = <IconChartBar size={18} />;
const ICON_MAP      = <IconMapPin size={18} />;
const ICON_SETTINGS = <IconSettings size={18} />;
const ICON_UTILS    = <IconTool size={18} />;
const ICON_BATTERY  = <IconBattery2 size={18} />;

export default function SpotlightSearch() {
  const navigate = useNavigate();
  const { flights, spots } = useData();

  const actions = useMemo<(SpotlightActionData | SpotlightActionGroupData)[]>(() => {
    const pages: SpotlightActionData[] = [
      { id: 'nav-home',     label: 'Dashboard',         description: 'Main dashboard',            leftSection: ICON_HOME,     onClick: () => navigate('/') },
      { id: 'nav-flights',  label: 'Flight Log',        description: 'Browse all logged flights', leftSection: ICON_FLIGHTS,  onClick: () => navigate('/flights') },
      { id: 'nav-stats',    label: 'Flight Statistics', description: 'Charts and analytics',      leftSection: ICON_STATS,    onClick: () => navigate('/flights/stats') },
      { id: 'nav-spots',    label: 'Flight Spots Map',  description: 'Interactive spots map',     leftSection: ICON_MAP,      onClick: () => navigate('/spots') },
      { id: 'nav-settings', label: 'Settings',          description: 'API keys and preferences', leftSection: ICON_SETTINGS, onClick: () => navigate('/settings') },
      { id: 'nav-utils',    label: 'Utilities',         description: 'Stick commands and tools',  leftSection: ICON_UTILS,    onClick: () => navigate('/utils') },
    ];

    const spotActions: SpotlightActionData[] = spots.map(s => ({
      id: `spot-${s.id}`,
      label: s.name,
      description: [
        s.category,
        s.tags?.join(', '),
        `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`,
      ].filter(Boolean).join(' · '),
      leftSection: ICON_MAP,
      onClick: () => navigate(`/spots?highlight=${s.id}`),
    }));

    const spotMap = new Map(spots.map(s => [s.id, s]));
    const flightActions: SpotlightActionData[] = flights.slice(0, 50).map(f => {
      const dateLabel = f.date
        ? new Date(f.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const spotName = f.spotId ? spotMap.get(f.spotId)?.name : undefined;
      const mahLabel = f.usedMah ? `${f.usedMah} mAh` : '';
      const batLabel = f.batType && f.batType !== 'Unknown' ? `${f.cellCount}S ${f.batType}` : '';
      return {
        id: `flight-${f.id}`,
        label: f.name,
        description: [dateLabel, spotName || f.location, mahLabel, batLabel].filter(Boolean).join(' · '),
        leftSection: ICON_BATTERY,
        onClick: () => navigate(`/flights?highlight=${f.id}`),
      };
    });

    const groups: (SpotlightActionData | SpotlightActionGroupData)[] = [
      { group: 'Pages', actions: pages },
    ];
    if (spotActions.length > 0) groups.push({ group: 'Spots', actions: spotActions });
    if (flightActions.length > 0) groups.push({ group: 'Recent Flights', actions: flightActions });

    return groups;
  }, [flights, spots, navigate]);

  return (
    <Spotlight
      actions={actions}
      shortcut="mod + k"
      nothingFound="No results found"
      highlightQuery
      searchProps={{ placeholder: 'Search pages, spots, flights…' }}
    />
  );
}
