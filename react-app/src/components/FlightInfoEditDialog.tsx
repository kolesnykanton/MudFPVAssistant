import { useState, useEffect } from 'react';
import {
  Modal, TextInput, Textarea, Button, Select, NumberInput,
  Stack, Group, Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { FlightInfo, BatteryType, WithId } from '../types';
import { normalizeFlightTime } from '../utils/flightTime';

const BATTERY_TYPES: BatteryType[] = ['Unknown', 'LiPo', 'LiIon'];
const CELL_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Props {
  open: boolean;
  flight: WithId<FlightInfo> | null;
  onSave: (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => Promise<void>;
  onClose: () => void;
}

export default function FlightInfoEditDialog({ open, flight, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [usedMah, setUsedMah] = useState<number | string>('');
  const [batType, setBatType] = useState<BatteryType>('LiPo');
  const [cellCount, setCellCount] = useState<number>(4);
  const [flightTime, setFlightTime] = useState('');
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [timeError, setTimeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open && flight) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(flight.name ?? '');
      setUsedMah(flight.usedMah ?? '');
      setBatType(flight.batType ?? 'LiPo');
      setCellCount(flight.cellCount ?? 4);
      setFlightTime(flight.flightTime ?? '');
      setLocation(flight.location ?? '');
      setComment(flight.comment ?? '');
      setDate(flight.date ?? null);
      setTimeError('');
      setSaving(false);
      setSaveError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, flight]);

  const handleSave = async () => {
    if (!flight || !name.trim() || saving) return;
    if (flightTime && !/^\d{1,2}:\d{2}$/.test(flightTime)) {
      setTimeError('Use format mm:ss (e.g. 4:20)');
      return;
    }
    setTimeError('');
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(flight.id, {
        name: name.trim(),
        batType,
        cellCount,
        location: location.trim(),
        comment: comment.trim() || undefined,
        usedMah: usedMah !== '' ? Number(usedMah) : undefined,
        flightTime: normalizeFlightTime(flightTime),
        date: date ?? undefined,
      });
      onClose();
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title="Edit Flight"
      centered
      size="md"
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          size="sm"
        />
        <Group grow>
          <NumberInput
            label="Battery Used (mAh)"
            value={usedMah}
            onChange={val => setUsedMah(val)}
            min={0}
            size="sm"
          />
          <Select
            label="Battery Type"
            value={batType}
            onChange={val => setBatType((val ?? 'LiPo') as BatteryType)}
            data={BATTERY_TYPES}
            size="sm"
          />
        </Group>
        <Group grow>
          <Select
            label="Cell Count"
            value={String(cellCount)}
            onChange={val => setCellCount(Number(val ?? '4'))}
            data={CELL_COUNTS.map(c => ({ value: String(c), label: `${c}S` }))}
            size="sm"
          />
          <TextInput
            label="Flight Time"
            value={flightTime}
            onChange={e => { setFlightTime(e.target.value); setTimeError(''); }}
            placeholder="04:20"
            size="sm"
            error={timeError || undefined}
            description={!timeError ? 'Format: mm:ss' : undefined}
          />
        </Group>
        <TextInput
          label="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          size="sm"
        />
        <Textarea
          label="Comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          size="sm"
        />
        <DateInput
          label="Flight Date"
          value={date}
          onChange={setDate}
          size="sm"
          clearable
        />
        {saveError && (
          <Alert color="red" variant="light">{saveError}</Alert>
        )}
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving} loading={saving}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
