import { useState } from 'react';
import { Button, Modal, Stack, Text, Group } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { usePublishSpot } from '../../hooks/usePublishSpot';
import type { FlightSpot } from '../../types';

interface Props {
  spot: FlightSpot & { id: string };
}

export function PublishSpotButton({ spot }: Props) {
  const { publishSpot, unpublishSpot } = usePublishSpot();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPublished = !!spot.publishedAsId;

  const handlePublish = async () => {
    setLoading(true);
    try {
      await publishSpot(spot);
      notifications.show({ color: 'green', message: 'Spot shared with community!' });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to share spot.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    try {
      if (spot.publishedAsId) {
        await unpublishSpot(spot.id, spot.publishedAsId);
      }
      notifications.show({ color: 'green', message: 'Spot removed from community.' });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      notifications.show({ color: 'red', message: 'Failed to unshare spot.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="light"
        size="sm"
        leftSection={<IconShare2 size={14} />}
        onClick={() => setModalOpen(true)}
        fullWidth
      >
        {isPublished ? 'Unshare from community' : 'Share with community'}
      </Button>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isPublished ? 'Remove from community' : 'Share spot with community'}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {isPublished
              ? 'This spot is currently shared with the community. Remove it?'
              : 'Your name and avatar will be visible to all pilots. Photo will be re-uploaded.'}
          </Text>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" onClick={() => setModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={isPublished ? handleUnpublish : handlePublish}
              loading={loading}
              color={isPublished ? 'red' : 'blue'}
            >
              {isPublished ? 'Remove' : 'Share'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
