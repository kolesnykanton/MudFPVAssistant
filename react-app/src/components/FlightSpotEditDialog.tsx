import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Chip,
  Stack,
  Group,
  Text,
  Alert,
  Image,
  FileButton,
  ActionIcon,
  Box,
} from '@mantine/core';
import { IconUpload, IconX } from '@tabler/icons-react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { resizeImage } from '../utils/imageUtils';
import type { FlightSpot } from '../types';
import { SPOT_CATEGORIES } from '../types';

interface Props {
  open: boolean;
  spot: Partial<FlightSpot> | null;
  coords?: { lat: number; lng: number };
  onSave: (spot: Omit<FlightSpot, 'id'>) => Promise<void>;
  onClose: () => void;
}

export default function FlightSpotEditDialog({ open, spot, coords, onSave, onClose }: Props) {
  const { uid } = useAuth();
  const [name, setName] = useState('');
  const [comments, setComments] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const resetRef = useRef<() => void>(null);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(spot?.name ?? '');
      setComments(spot?.comments ?? '');
      setCategory(spot?.category ?? '');
      setTagsInput(spot?.tags?.join(', ') ?? '');
      setPhotoFile(null);
      setPhotoPreview(spot?.photoUrl ?? null);
      setRemoveExistingPhoto(false);
      setSaving(false);
      setSaveError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, spot]);

  // Revoke any blob URL created by createObjectURL when the preview changes or modal closes.
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleFileChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setRemoveExistingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemoveExistingPhoto(true);
    resetRef.current?.();
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    const latitude = spot?.latitude ?? coords?.lat ?? 0;
    const longitude = spot?.longitude ?? coords?.lng ?? 0;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    setSaving(true);
    setSaveError(null);
    try {
      let photoUrl: string | undefined = spot?.photoUrl;
      let storagePath: string | undefined = spot?.storagePath;

      if (removeExistingPhoto && storagePath) {
        try { await deleteObject(storageRef(storage, storagePath)); } catch { /* already gone */ }
        photoUrl = undefined;
        storagePath = undefined;
      }

      if (photoFile && uid) {
        const resized = await resizeImage(photoFile);
        const path = `users/${uid}/FlightSpots/${Date.now()}/${photoFile.name}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, resized);
        photoUrl = await getDownloadURL(fileRef);
        if (spot?.storagePath && spot.storagePath !== path) {
          try { await deleteObject(storageRef(storage, spot.storagePath)); } catch { /* already gone */ }
        }
        storagePath = path;
      }

      await onSave({
        name: name.trim(), comments, category, tags, latitude, longitude,
        ...(photoUrl ? { photoUrl, storagePath } : {}),
      });
    } catch {
      setSaveError('Failed to save spot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={spot?.id ? 'Edit Flight Spot' : 'Add Flight Spot'}
      centered
      size="sm"
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          size="sm"
        />
        <Textarea
          label="Comments"
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          size="sm"
        />
        <div>
          <Text size="sm" fw={500} mb={6}>Category</Text>
          <Chip.Group value={category} onChange={val => setCategory(typeof val === 'string' ? val : '')}>
            <Group gap="xs">
              {SPOT_CATEGORIES.map(cat => (
                <Chip key={cat} value={cat} size="sm">{cat}</Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
        <TextInput
          label="Tags (comma-separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          size="sm"
        />

        <div>
          <Text size="sm" fw={500} mb={6}>Photo</Text>
          {photoPreview ? (
            <Box pos="relative" style={{ display: 'inline-block' }}>
              <Image src={photoPreview} radius="sm" maw={200} mah={150} fit="cover" alt="Spot photo" />
              <ActionIcon
                size="xs"
                color="red"
                variant="filled"
                pos="absolute"
                top={4}
                right={4}
                onClick={handleRemovePhoto}
                aria-label="Remove photo"
              >
                <IconX size={10} />
              </ActionIcon>
            </Box>
          ) : (
            <FileButton resetRef={resetRef} onChange={handleFileChange} accept="image/*">
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  size="xs"
                  leftSection={<IconUpload size={14} />}
                >
                  Upload photo
                </Button>
              )}
            </FileButton>
          )}
        </div>

        {saveError && (
          <Alert color="red" variant="light">{saveError}</Alert>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving} loading={saving}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
