import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import type { FlightInfo, BatteryType } from '../types';

interface AddFlightFormProps {
  onAdd: (flight: Omit<FlightInfo, 'id'>) => Promise<void>;
}

const BATTERY_TYPES: BatteryType[] = ['Unknown', 'LiPo', 'LiIon'];
const CELL_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AddFlightForm({ onAdd }: AddFlightFormProps) {
  const [name, setName] = useState('');
  const [usedMah, setUsedMah] = useState<number | ''>('');
  const [batType, setBatType] = useState<BatteryType>('LiPo');
  const [cellCount, setCellCount] = useState<number>(4);
  const [flightTime, setFlightTime] = useState('');
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    // Validate flight time format if provided
    if (flightTime && !/^\d{2}:\d{2}$/.test(flightTime)) {
      setTimeError('Please use format mm:ss (e.g. 04:20)');
      return;
    }
    setTimeError('');

    const flight: Omit<FlightInfo, 'id'> = {
      name: name.trim(),
      batType,
      cellCount,
      location: location.trim(),
      comment: comment.trim() || undefined,
      usedMah: usedMah !== '' ? Number(usedMah) : undefined,
      flightTime: flightTime || undefined,
      date: date || undefined,
    };

    try {
      setSubmitting(true);
      await onAdd(flight);
      // Reset form
      setName('');
      setUsedMah('');
      setBatType('LiPo');
      setCellCount(4);
      setFlightTime('');
      setLocation('');
      setComment('');
      setDate(todayString());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        New Flight
      </Typography>

      <Box component="form" noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Name (Drone, Battery, etc.)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Battery Used (mAh)"
              type="number"
              value={usedMah}
              onChange={e => setUsedMah(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Battery Type</InputLabel>
              <Select
                value={batType}
                label="Battery Type"
                onChange={e => setBatType(e.target.value as BatteryType)}
              >
                {BATTERY_TYPES.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Cell Count</InputLabel>
              <Select
                value={cellCount}
                label="Cell Count"
                onChange={e => setCellCount(Number(e.target.value))}
              >
                {CELL_COUNTS.map(c => (
                  <MenuItem key={c} value={c}>{c}S</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Flight Time"
              value={flightTime}
              onChange={e => { setFlightTime(e.target.value); setTimeError(''); }}
              placeholder="04:20"
              fullWidth
              size="small"
              error={!!timeError}
              helperText={timeError || 'Format: mm:ss'}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Flight Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              disabled={!isValid || submitting}
              onClick={handleSubmit}
            >
              Add Flight
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
