import { useEffect, useMemo, useState } from 'react';
import {
  Anchor, Badge, Combobox, Group, InputBase, Text, useCombobox,
} from '@mantine/core';
import type { MantineSize } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CATEGORY_COLORS } from '../types';

interface SpotLocationPickerProps {
  spotId: string | undefined;
  location: string;
  onChange: (spotId: string | undefined, location: string) => void;
  size?: MantineSize;
}

export default function SpotLocationPicker({
  spotId, location, onChange, size = 'sm',
}: SpotLocationPickerProps) {
  const { spots, flights } = useData();
  const navigate = useNavigate();
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [inputValue, setInputValue] = useState(location);

  // Sync input when parent resets the value (e.g. dialog re-opens with different flight)
  useEffect(() => { setInputValue(location); }, [location]);

  const flightCountBySpot = useMemo(() =>
    flights.reduce((acc, f) => {
      if (f.spotId) acc[f.spotId] = (acc[f.spotId] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  , [flights]);

  const sortedSpots = useMemo(() =>
    [...spots].sort((a, b) =>
      (flightCountBySpot[b.id ?? ''] ?? 0) - (flightCountBySpot[a.id ?? ''] ?? 0)
    )
  , [spots, flightCountBySpot]);

  const filteredSpots = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return sortedSpots;
    return sortedSpots.filter(s => s.name.toLowerCase().includes(q));
  }, [sortedSpots, inputValue]);

  const selectedSpot = spotId ? spots.find(s => s.id === spotId) : undefined;

  const handleSelect = (sid: string) => {
    const spot = spots.find(s => s.id === sid);
    if (!spot?.id) return;
    onChange(spot.id, spot.name);
    setInputValue(spot.name);
    combobox.closeDropdown();
  };

  const handleBlur = () => {
    const trimmed = inputValue.trim();
    // If user cleared the input, clear spotId too
    if (!trimmed) { onChange(undefined, ''); return; }
    // If still showing the selected spot's name, keep the spotId
    if (selectedSpot && inputValue === selectedSpot.name) return;
    // Any other text = custom location
    onChange(undefined, trimmed);
  };

  const categoryColor = selectedSpot?.category
    ? CATEGORY_COLORS[selectedSpot.category]
    : undefined;

  return (
    <div>
      <Combobox store={combobox} onOptionSubmit={handleSelect}>
        <Combobox.Target>
          <InputBase
            label="Location"
            size={size}
            value={inputValue}
            placeholder="Select a spot or type custom location"
            onChange={e => {
              const val = e.currentTarget.value;
              setInputValue(val);
              if (spotId) onChange(undefined, val);
              combobox.openDropdown();
            }}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => { combobox.closeDropdown(); handleBlur(); }}
            rightSection={
              categoryColor
                ? (
                  <Badge
                    size="xs"
                    style={{ background: categoryColor, color: 'white', pointerEvents: 'none' }}
                  >
                    {selectedSpot!.category}
                  </Badge>
                )
                : null
            }
            rightSectionWidth={categoryColor ? 80 : undefined}
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            {filteredSpots.length === 0 ? (
              <Combobox.Empty>No saved spots found</Combobox.Empty>
            ) : (
              filteredSpots.map(spot => {
                const count = flightCountBySpot[spot.id ?? ''] ?? 0;
                const color = spot.category ? (CATEGORY_COLORS[spot.category] ?? '#888') : '#888';
                return (
                  <Combobox.Option key={spot.id} value={spot.id ?? ''}>
                    <Group gap="xs" wrap="nowrap">
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: color, flexShrink: 0,
                      }} />
                      <Text size="sm" flex={1}>{spot.name}</Text>
                      {count > 0 && (
                        <Badge size="xs" variant="light" color="blue">
                          {count} flight{count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </Group>
                  </Combobox.Option>
                );
              })
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      <Anchor
        size="xs"
        c="dimmed"
        mt={4}
        style={{ display: 'block', userSelect: 'none' }}
        onClick={() => navigate('/map-spot-save')}
      >
        pick on map 🗺
      </Anchor>
    </div>
  );
}
