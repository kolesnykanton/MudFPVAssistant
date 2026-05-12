import { Drawer, Modal, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { FlightInfo } from '../../types';
import AddFlightForm from '../AddFlightForm';

interface Props {
  opened: boolean;
  onClose: () => void;
  onAdd: (flight: Omit<FlightInfo, 'id'>) => Promise<void>;
}

export default function AddFlightModal({ opened, onClose, onAdd }: Props) {
  const isMobile = useMediaQuery('(max-width: 640px)') ?? false;

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        position="bottom"
        size="92%"
        title={<Title order={5}>Log Flight</Title>}
        styles={{ body: { paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)', overflowY: 'auto' } }}
      >
        <AddFlightForm onAdd={onAdd} />
      </Drawer>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={5}>Log Flight</Title>}
      size="lg"
    >
      <AddFlightForm onAdd={onAdd} />
    </Modal>
  );
}
