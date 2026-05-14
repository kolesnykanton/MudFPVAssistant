import { useState, useMemo, useCallback } from 'react';
import { Text, Drawer, ActionIcon, Group, Title, Stack, Center, Loader, Container, SegmentedControl } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconList, IconMapPin } from '@tabler/icons-react';

const VIEW_TOGGLE_DATA = [
  { label: <Group gap={4} wrap="nowrap"><IconList size={14} /><span>List</span></Group>, value: 'list' },
  { label: <Group gap={4} wrap="nowrap"><IconMapPin size={14} /><span>Map</span></Group>, value: 'map' },
];
import { notifications } from '@mantine/notifications';
import { useData } from '../context/DataContext';
import { usePublishSpot } from '../hooks/usePublishSpot';
import { CommunitySpotCard } from '../components/community/CommunitySpotCard';
import { CommunitySpotFilters } from '../components/community/CommunitySpotFilters';
import { CommunityMapView, type CommunityFlyToTarget } from '../components/community/CommunityMapView';
import type { WithId, CommunitySpot } from '../types';

export default function CommunitySpots() {
  const { communitySpots, communityLoading, favoriteIds, toggleFavorite } = useData();
  const { cloneToMySpots } = usePublishSpot();
  const isDesktop = useMediaQuery('(min-width: 48em)');

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoritedOnly, setFavoritedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [flyToTarget, setFlyToTarget] = useState<CommunityFlyToTarget | null>(null);

  const filteredSpots = useMemo(() => {
    let result = communitySpots;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q)
        || s.comments?.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q)),
      );
    }

    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory);
    }

    if (favoritedOnly) {
      result = result.filter(s => favoriteIds.has(s.id!));
    }

    return result;
  }, [communitySpots, searchQuery, selectedCategory, favoritedOnly, favoriteIds]);

  const handleClone = useCallback(async (spot: WithId<CommunitySpot>) => {
    try {
      await cloneToMySpots(spot);
      notifications.show({ color: 'green', message: `"${spot.name}" saved to your spots!` });
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to save spot.' });
    }
  }, [cloneToMySpots]);

  const handleLocate = useCallback((spot: WithId<CommunitySpot>) => {
    setFlyToTarget({ lat: spot.latitude, lng: spot.longitude, spotId: spot.id, nonce: Date.now() });
    setViewMode('map');
  }, []);

  const handleFavoriteToggle = useCallback(async (spotId: string) => {
    try {
      await toggleFavorite(spotId);
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to update favorite.' });
    }
  }, [toggleFavorite]);

  if (communityLoading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  const viewToggle = (
    <SegmentedControl
      size="xs"
      value={viewMode}
      onChange={v => setViewMode(v as 'list' | 'map')}
      data={VIEW_TOGGLE_DATA}
    />
  );

  const pageHeader = (
    <Group justify="space-between" mb={viewMode === 'map' ? 'md' : 'lg'}>
      <Title order={2}>Community Flight Spots</Title>
      <Group gap="sm">
        {!isDesktop && (
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open filters"
          >
            <IconList size={20} />
          </ActionIcon>
        )}
        {viewToggle}
      </Group>
    </Group>
  );

  const filtersBar = isDesktop ? (
    <CommunitySpotFilters
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      favoritedOnly={favoritedOnly}
      onFavoritedOnlyChange={setFavoritedOnly}
    />
  ) : null;

  const mobileFilterDrawer = !isDesktop ? (
    <Drawer
      opened={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      position="bottom"
      size="75%"
      title="Filters"
    >
      <CommunitySpotFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        favoritedOnly={favoritedOnly}
        onFavoritedOnlyChange={setFavoritedOnly}
      />
    </Drawer>
  ) : null;

  if (viewMode === 'map') {
    return (
      <>
        <Container py="md">
          {pageHeader}
          {filtersBar}
        </Container>
        <CommunityMapView
          spots={filteredSpots}
          favoriteIds={favoriteIds}
          onFavoriteToggle={handleFavoriteToggle}
          onClone={handleClone}
          flyToTarget={flyToTarget}
        />
        {mobileFilterDrawer}
      </>
    );
  }

  return (
    <Container py="lg">
      {pageHeader}

      <Stack gap="lg">
        {filtersBar}

        <Stack gap="sm">
          {filteredSpots.length === 0 ? (
            <Center py="xl">
              <Text size="sm" c="dimmed">
                {communitySpots.length === 0 ? 'No community spots yet' : 'No spots match your filters'}
              </Text>
            </Center>
          ) : (
            filteredSpots.map(spot => (
              <CommunitySpotCard
                key={spot.id}
                spot={spot}
                isFavorited={favoriteIds.has(spot.id!)}
                onFavoriteToggle={handleFavoriteToggle}
                onClone={handleClone}
                onLocate={handleLocate}
              />
            ))
          )}
        </Stack>
      </Stack>

      {mobileFilterDrawer}
    </Container>
  );
}
