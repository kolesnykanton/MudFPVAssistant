import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { FlightInfo } from '../types';

interface FlightTableProps {
  flights: FlightInfo[];
  selectedDate: string | null; // "YYYY-MM-DD" or null
  onDelete: (id: string) => void;
}

export default function FlightTable({ flights, selectedDate, onDelete }: FlightTableProps) {
  const filtered = selectedDate
    ? flights.filter(f => f.date === selectedDate)
    : flights;

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Flight History {selectedDate ? `— ${selectedDate}` : '(all)'}
      </Typography>

      {sorted.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No flights found{selectedDate ? ' for this date' : ''}.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>mAh</TableCell>
                <TableCell>Cells</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map(flight => (
                <TableRow key={flight.id} hover>
                  <TableCell>{flight.date ?? '—'}</TableCell>
                  <TableCell>{flight.name}</TableCell>
                  <TableCell>{flight.location}</TableCell>
                  <TableCell>{flight.flightTime ?? '—'}</TableCell>
                  <TableCell>{flight.usedMah ?? '—'}</TableCell>
                  <TableCell>{flight.cellCount}S</TableCell>
                  <TableCell>{flight.batType}</TableCell>
                  <TableCell
                    sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {flight.comment ?? '—'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => flight.id && onDelete(flight.id)}
                      disabled={!flight.id}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
