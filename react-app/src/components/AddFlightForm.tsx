import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  NumberInput,
  Paper,
  Select,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCirclePlus } from '@tabler/icons-react';
import type { FlightInfo, BatteryType } from '../types';

interface AddFlightFormProps {
  onAdd: (flight: Omit<FlightInfo, 'id'>) => Promise<void>;
}

const BATTERY_TYPES: BatteryType[] = ['Unknown', 'LiPo', 'LiIon'];
const CELL_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AddFlightForm({ onAdd }: AddFlightFormProps) {
  const [name, setName] = useState('');
  const [usedMah, setUsedMah] = useState<number | string>('');
  const [batType, setBatType] = useState<BatteryType>('LiPo');
  const [cellCount, setCellCount] = useState<number>(4);
  const [flightTime, setFlightTime] = useState('');
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    // Validate flight time format if provided
    if (flightTime && !/^\d{1,2}:\d{2}$/.test(flightTime)) {
      setTimeError('Please use format mm:ss (e.g. 4:20)');
      return;
    }
    setTimeError('');

    // Pad single-digit minutes (e.g. "4:20" → "04:20") so storage stays consistent.
    const normalisedFlightTime = flightTime
      ? flightTime.split(':').map((p, i) => i === 0 ? p.padStart(2, '0') : p).join(':')
      : undefined;

    const flight: Omit<FlightInfo, 'id'> = {
      name: name.trim(),
      batType,
      cellCount,
      location: location.trim(),
      comment: comment.trim() || undefined,
      usedMah: usedMah !== '' ? Number(usedMah) : undefined,
      flightTime: normalisedFlightTime,
      date: date ?? undefined,
    };

    try {
      setSubmitting(true);
      await onAdd(flight);
      setName('');
      setUsedMah('');
      setBatType('LiPo');
      setCellCount(4);
      setFlightTime('');
      setLocation('');
      setComment('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to save flight. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={5} mb="md">New Flight</Title>

      <Box component="form" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        <Grid gap="sm">
          <Grid.Col span={12}>
            <TextInput
              label="Name (Drone, Battery, etc.)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              size="sm"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label="Battery Used (mAh)"
              value={usedMah}
              onChange={val => setUsedMah(val)}
              min={0}
              size="sm"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Battery Type"
              value={batType}
              onChange={val => setBatType((val ?? 'LiPo') as BatteryType)}
              data={BATTERY_TYPES}
              size="sm"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Cell Count"
              value={String(cellCount)}
              onChange={val => setCellCount(Number(val ?? '4'))}
              data={CELL_COUNTS.map(c => ({ value: String(c), label: `${c}S` }))}
              size="sm"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Flight Time"
              value={flightTime}
              onChange={e => { setFlightTime(e.target.value); setTimeError(''); }}
              placeholder="04:20"
              size="sm"
              error={timeError || undefined}
              description={!timeError ? 'Format: mm:ss' : undefined}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <TextInput
              label="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              size="sm"
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              size="sm"
              rows={2}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <DateInput
              label="Flight Date"
              value={date}
              onChange={setDate}
              size="sm"
              clearable
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Button
              type="submit"
              variant="filled"
              leftSection={<IconCirclePlus size={16} />}
              disabled={!isValid || submitting}
              loading={submitting}
            >
              Add Flight
            </Button>
          </Grid.Col>
        </Grid>
      </Box>
    </Paper>
  );
}
