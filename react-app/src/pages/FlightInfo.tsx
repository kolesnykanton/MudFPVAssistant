import { useState } from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useUserCollection } from '../hooks/useUserCollection';
import type { FlightInfo as FlightInfoType } from '../types';
import AddFlightForm from '../components/AddFlightForm';
import FlightTable from '../components/FlightTable';
import FlightStats from '../components/FlightStats';

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function FlightInfo() {
  const { items: flights, loading, add, remove } = useUserCollection<FlightInfoType>('FlightInfos');
  const [selectedDate, setSelectedDate] = useState<string>(todayString());

  const handleAdd = async (flight: Omit<FlightInfoType, 'id'>) => {
    await add(flight);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Flight Log
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Add flight form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <AddFlightForm onAdd={handleAdd} />
          </Grid>

          {/* Date filter + table */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Filter by Date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
                sx={{ width: 200 }}
              />
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setSelectedDate('')}
              >
                Show all
              </Typography>
            </Box>
            <FlightTable
              flights={flights}
              selectedDate={selectedDate || null}
              onDelete={handleDelete}
            />
          </Grid>

          {/* Stats charts — visible only when there are flights */}
          {flights.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Statistics
              </Typography>
              <FlightStats flights={flights} />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
