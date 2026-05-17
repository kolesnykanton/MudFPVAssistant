import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Text, Drawer, ActionIcon, Group, Title, Stack, Center, Loader, Container, SegmentedControl } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconList, IconMapPin, IconUsers, IconFilter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePublishSpot } from '../hooks/usePublishSpot';
import { CommunitySpotCard } from '../components/community/CommunitySpotCard';
import { CommunitySpotFilters } from '../components/community/CommunitySpotFilters';
import type { CommunityFlyToTarget } from '../components/community/CommunityMapView';
import type { WithId, CommunitySpot } from '../types';

const CommunityMapView = lazy(() =>
  import('../components/community/CommunityMapView')
    .then(m => ({ default: m.CommunityMapView }))
);

const mapLoader = (
  <Center h={400}>
    <Loader />
  </Center>
);

export default function CommunitySpots() {
  const { uid } = useAuth();
  const { communitySpots, communityLoading, favoriteIds, toggleFavorite, spots } = useData();
  const { cloneToMySpots } = usePublishSpot();
  const isDesktop = useMediaQuery('(min-width: 48em)');

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoritedOnly, setFavoritedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [flyToTarget, setFlyToTarget] = useState<CommunityFlyToTarget | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [favoritingId, setFavoritingId] = useState<string | null>(null);

  const clonedCommunityIds = useMemo(
    () => new Set(spots.flatMap(s => s.clonedFromCommunityId ? [s.clonedFromCommunityId] : [])),
    [spots],
  );

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
    if (cloningId) return;
    setCloningId(spot.id!);
    try {
      await cloneToMySpots(spot);
      notifications.show({ color: 'green', message: `"${spot.name}" saved to your spots!` });
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to save spot.' });
    } finally {
      setCloningId(null);
    }
  }, [cloneToMySpots, cloningId]);

  const handleLocate = useCallback((spot: WithId<CommunitySpot>) => {
    setFlyToTarget({ lat: spot.latitude, lng: spot.longitude, spotId: spot.id, nonce: Date.now() });
    setViewMode('map');
  }, []);

  const handleFavoriteToggle = useCallback(async (spotId: string) => {
    if (favoritingId) return;
    setFavoritingId(spotId);
    try {
      await toggleFavorite(spotId);
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to update favourite.' });
    } finally {
      setFavoritingId(null);
    }
  }, [toggleFavorite, favoritingId]);

  if (communityLoading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  const mapLabel = filteredSpots.length > 0
    ? `Map (${filteredSpots.length})`
    : 'Map';

  const viewToggle = (
    <SegmentedControl
      size="xs"
      value={viewMode}
      onChange={v => setViewMode(v as 'list' | 'map')}
      data={[
        { label: <Group gap={4} wrap="nowrap"><IconList size={14} /><span>List</span></Group>, value: 'list' },
        { label: <Group gap={4} wrap="nowrap"><IconMapPin size={14} /><span>{mapLabel}</span></Group>, value: 'map' },
      ]}
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
            <IconFilter size={20} />
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
        <Suspense fallback={mapLoader}>
          <CommunityMapView
            spots={filteredSpots}
            favoriteIds={favoriteIds}
            currentUserId={uid ?? undefined}
            cloningId={cloningId}
            favoritingId={favoritingId}
            clonedCommunityIds={clonedCommunityIds}
            onFavoriteToggle={handleFavoriteToggle}
            onClone={handleClone}
            flyToTarget={flyToTarget}
          />
        </Suspense>
        {mobileFilterDrawer}
      </>
    );
  }

  const emptyState = (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <IconUsers size={48} stroke={1} style={{ opacity: 0.25 }} />
        <Text size="sm" c="dimmed" fw={500}>
          {communitySpots.length === 0 ? 'No spots shared yet' : 'No spots match your filters'}
        </Text>
        {communitySpots.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" maw={260}>
            Publish one of your saved flight spots to share it with the community
          </Text>
        )}
      </Stack>
    </Center>
  );

  return (
    <Container py="lg">
      {pageHeader}

      <Stack gap="lg">
        {filtersBar}

        <Stack gap="sm">
          {filteredSpots.length === 0 ? emptyState : (
            filteredSpots.map(spot => (
              <CommunitySpotCard
                key={spot.id}
                spot={spot}
                isFavorited={favoriteIds.has(spot.id!)}
                isOwnSpot={!!uid && spot.ownerId === uid}
                isCloning={cloningId === spot.id}
                isFavoriting={favoritingId === spot.id}
                isAlreadyCloned={clonedCommunityIds.has(spot.id!)}
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
