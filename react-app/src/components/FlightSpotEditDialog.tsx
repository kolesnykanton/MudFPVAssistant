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
  Alert,
} from '@mantine/core';
import type { FlightSpot } from '../types';

const CATEGORIES = ['Mountain', 'Beach', 'Building', 'Forest', 'Field'];

interface Props {
  open: boolean;
  spot: Partial<FlightSpot> | null;
  coords?: { lat: number; lng: number };
  onSave: (spot: Omit<FlightSpot, 'id'>) => Promise<void>;
  onClose: () => void;
}

export default function FlightSpotEditDialog({ open, spot, coords, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [comments, setComments] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(spot?.name ?? '');
      setComments(spot?.comments ?? '');
      setCategory(spot?.category ?? '');
      setTagsInput(spot?.tags?.join(', ') ?? '');
      setSaving(false);
      setSaveError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, spot]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    const latitude = spot?.latitude ?? coords?.lat ?? 0;
    const longitude = spot?.longitude ?? coords?.lng ?? 0;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ name: name.trim(), comments, category, tags, latitude, longitude });
    } catch {
      setSaveError('Failed to save spot. Please try again.');
    } finally {
      setSaving(false);
    }
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
        {saveError && (
          <Alert color="red" variant="light">{saveError}</Alert>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving} loading={saving}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
