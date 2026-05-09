import { Group, NumberInput, Text } from '@mantine/core';

interface FlightTimeInputProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

function parseTime(value: string | undefined): [number | '', number | ''] {
  if (!value) return ['', ''];
  const parts = value.split(':');
  if (parts.length !== 2) return ['', ''];
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return ['', ''];
  return [mins, secs];
}

function buildTime(m: number | '', s: number | ''): string | undefined {
  if (m === '' && s === '') return undefined;
  const mm = m === '' ? 0 : m;
  const ss = s === '' ? 0 : s;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function FlightTimeInput({ value, onChange, size = 'sm', label = 'Flight Time' }: FlightTimeInputProps) {
  const [mins, secs] = parseTime(value);

  return (
    <div>
      <Text size="sm" fw={500} mb={4}>{label}</Text>
      <Group gap={6} align="flex-start" wrap="nowrap">
        <NumberInput
          value={mins}
          onChange={v => onChange(buildTime(v as number | '', secs))}
          min={0}
          max={99}
          size={size}
          w={68}
          placeholder="00"
          hideControls
          aria-label="Minutes"
          suffix="m"
        />
        <Text size="xl" fw={700} c="dimmed" style={{ lineHeight: size === 'sm' ? '36px' : '42px' }}>:</Text>
        <NumberInput
          value={secs}
          onChange={v => onChange(buildTime(mins, v as number | ''))}
          min={0}
          max={59}
          size={size}
          w={68}
          placeholder="00"
          hideControls
          aria-label="Seconds"
          suffix="s"
        />
      </Group>
    </div>
  );
}
