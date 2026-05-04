import { Paper, Title, Group } from '@mantine/core';
import StickAnimation from './StickAnimation';

interface Props {
  command: string;
  leftSegment: string;
  rightSegment: string;
}

export default function OsdCommandPanel({ command, leftSegment, rightSegment }: Props) {
  return (
    <Paper withBorder shadow="xs" p="sm" m="xs" radius="md">
      <Title order={5} ta="center" mb="xs">{command}</Title>
      <Group justify="center" gap={0} grow>
        <StickAnimation segment={leftSegment} />
        <StickAnimation segment={rightSegment} />
      </Group>
    </Paper>
  );
}
