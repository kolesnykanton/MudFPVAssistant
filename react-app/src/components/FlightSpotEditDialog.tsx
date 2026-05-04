import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Chip,
  Stack,
  Group,
  Text,
} from '@mantine/core';
import type { FlightSpot } from '../types';

const CATEGORIES = ['Mountain', 'Beach', 'Building', 'Forest', 'Field'];

interface Props {
  open: boolean;
  spot: Partial<FlightSpot> | null;
  coords?: { lat: number; lng: number };
  onSave: (spot: Omit<FlightSpot, 'id'>) => void;
  onClose: () => void;
}

export default function FlightSpotEditDialog({ open, spot, coords, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [comments, setComments] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (open) {
      setName(spot?.name ?? '');
      setComments(spot?.comments ?? '');
      setCategory(spot?.category ?? '');
      setTagsInput(spot?.tags?.join(', ') ?? '');
    }
  }, [open, spot]);

  const handleSave = () => {
    if (!name.trim()) return;
    const latitude = spot?.latitude ?? coords?.lat ?? 0;
    const longitude = spot?.longitude ?? coords?.lng ?? 0;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    onSave({ name: name.trim(), comments, category, tags, latitude, longitude });
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={spot?.id ? 'Edit Flight Spot' : 'Add Flight Spot'}
      centered
      size="sm"
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          size="sm"
        />
        <Textarea
          label="Comments"
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          size="sm"
        />
        <div>
          <Text size="sm" fw={500} mb={6}>Category</Text>
          <Chip.Group value={category} onChange={val => setCategory(typeof val === 'string' ? val : '')}>
            <Group gap="xs">
              {CATEGORIES.map(cat => (
                <Chip key={cat} value={cat} size="sm">
                  {cat}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
        <TextInput
          label="Tags (comma-separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          size="sm"
        />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
