import { Button, Group, Modal, Text } from '@mantine/core';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal opened={open} onClose={onClose} title={title} centered size="sm">
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="subtle" onClick={onClose}>{cancelLabel}</Button>
        <Button color={danger ? 'red' : 'blue'} onClick={onConfirm}>{confirmLabel}</Button>
      </Group>
    </Modal>
  );
}
