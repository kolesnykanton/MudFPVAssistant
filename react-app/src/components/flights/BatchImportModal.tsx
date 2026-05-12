import { useRef, useState } from 'react';
import { Alert, Button, FileButton, Modal, Progress, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useData } from '../../context/DataContext';
import type { FlightInfo } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function BatchImportModal({ opened, onClose }: Props) {
  const { addFlight } = useData();
  const fileResetRef = useRef<() => void>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  const handleImport = async (file: File | null) => {
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    setImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      const flightsToImport = Array.isArray(data) ? data : [data];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < flightsToImport.length; i++) {
        const f = flightsToImport[i] as Record<string, unknown>;
        try {
          await addFlight({
            name: (f.name as string) ?? 'Unnamed',
            date: f.date as string | undefined,
            usedMah: f.usedMah as number | undefined,
            flightTime: f.flightTime as string | undefined,
            location: (f.location as string) ?? '',
            comment: f.comment as string | undefined,
            batType: (f.batType as FlightInfo['batType']) ?? 'LiPo',
            cellCount: (f.cellCount as number) ?? 1,
          });
          successCount++;
          setImportProgress(Math.round((i + 1) / flightsToImport.length * 100));
        } catch (err) {
          failureCount++;
          console.error(`Failed to import flight ${i}:`, err);
        }
      }

      setImportSuccess(successCount);
      fileResetRef.current?.();

      if (successCount === 0) {
        const msg = `All ${failureCount} flight(s) failed to save.`;
        setImportError(msg);
        notifications.show({ color: 'red', icon: <IconAlertCircle size={16} />, title: 'Import failed', message: msg });
      } else if (failureCount > 0) {
        notifications.show({
          color: 'yellow', icon: <IconAlertCircle size={16} />,
          title: 'Partial import', message: `Added ${successCount}, failed ${failureCount}.`,
        });
      } else {
        notifications.show({ color: 'green', icon: <IconCheck size={16} />, title: 'Import successful', message: `Added ${successCount} flight(s).` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid file format';
      setImportError(msg);
      notifications.show({ color: 'red', icon: <IconAlertCircle size={16} />, title: 'Import failed', message: msg });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Batch Import Flights" size="md">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Upload a JSON file with flight data to add multiple flights at once.
        </Text>
        <FileButton resetRef={fileResetRef} accept="application/json" onChange={handleImport} disabled={importing}>
          {(props) => (
            <Button {...props} variant="light" size="sm" leftSection={<IconUpload size={14} />} loading={importing}>
              {importing ? 'Importing…' : 'Choose JSON file'}
            </Button>
          )}
        </FileButton>
        {importing && <Progress value={importProgress} size="sm" />}
        {importSuccess !== null && (
          <Alert icon={<IconCheck size={14} />} color="green" variant="light">
            Successfully imported {importSuccess} flight(s).
          </Alert>
        )}
        {importError && (
          <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light">
            {importError}
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
