import { Stack, TextInput, Chip, Group, Switch } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { SPOT_CATEGORIES } from '../../types';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  favoritedOnly: boolean;
  onFavoritedOnlyChange: (value: boolean) => void;
}

export function CommunitySpotFilters({
  searchQuery, onSearchChange,
  selectedCategory, onCategoryChange,
  favoritedOnly, onFavoritedOnlyChange,
}: Props) {
  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search spots..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        size="sm"
      />

      <div>
        <Chip.Group value={selectedCategory} onChange={val => onCategoryChange(typeof val === 'string' ? val : null)}>
          <Group gap="xs" mb={6}>
            <Chip value={''} size="sm">All</Chip>
            {SPOT_CATEGORIES.map(cat => (
              <Chip key={cat} value={cat} size="sm">{cat}</Chip>
            ))}
          </Group>
        </Chip.Group>
      </div>

      <Switch
        label="Favourited only"
        checked={favoritedOnly}
        onChange={e => onFavoritedOnlyChange(e.currentTarget.checked)}
        size="sm"
      />
    </Stack>
  );
}
