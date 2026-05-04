import { Paper, Typography, Box } from '@mui/material';
import StickAnimation from './StickAnimation';

interface Props {
  command: string;
  leftSegment: string;
  rightSegment: string;
}

export default function OsdCommandPanel({ command, leftSegment, rightSegment }: Props) {
  return (
    <Paper elevation={1} sx={{ p: 2, m: 1 }}>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>{command}</Typography>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StickAnimation segment={leftSegment} />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StickAnimation segment={rightSegment} />
        </Box>
      </Box>
    </Paper>
  );
}
