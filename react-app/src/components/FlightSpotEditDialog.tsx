import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Chip, Stack, Typography, Box,
} from '@mui/material';
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{spot?.id ? 'Edit Flight Spot' : 'Add Flight Spot'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Comments"
            value={comments}
            onChange={e => setComments(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
          />
          <Box>
            <Typography variant="caption" color="text.secondary">Category</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  clickable
                  color={category === cat ? 'primary' : 'default'}
                  onClick={() => setCategory(prev => (prev === cat ? '' : cat))}
                />
              ))}
            </Box>
          </Box>
          <TextField
            label="Tags (comma-separated)"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
