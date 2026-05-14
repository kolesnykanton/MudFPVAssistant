import { useState, useMemo, useCallback } from 'react';
import { Text, Drawer, ActionIcon, Group, Title, Stack, Center, Loader, Container } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconList } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useData } from '../context/DataContext';
import { usePublishSpot } from '../hooks/usePublishSpot';
import { CommunitySpotCard } from '../components/community/CommunitySpotCard';
import { CommunitySpotFilters } from '../components/community/CommunitySpotFilters';
import type { WithId, CommunitySpot } from '../types';

export default function CommunitySpots() {
  const { communitySpots, communityLoading, favoriteIds, toggleFavorite } = useData();
  const { cloneToMySpots } = usePublishSpot();
  const isDesktop = useMediaQuery('(min-width: 48em)');

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoritedOnly, setFavoritedOnly] = useState(false);

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

  return (
    <Container py="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Community Flight Spots</Title>
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
      </Group>

      <Stack gap="lg">
        {isDesktop && (
          <CommunitySpotFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            favoritedOnly={favoritedOnly}
            onFavoritedOnlyChange={setFavoritedOnly}
          />
        )}

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
              />
            ))
          )}
        </Stack>
      </Stack>

      {!isDesktop && (
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
      )}
    </Container>
  );
}
