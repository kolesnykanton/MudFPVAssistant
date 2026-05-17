import { Drawer, Stack, UnstyledButton, Text } from '@mantine/core';
import type { MapContextMenuItem } from '../MapContextMenu';

interface MapActionSheetProps {
  opened: boolean;
  title?: string;
  items: MapContextMenuItem[];
  onClose: () => void;
}

/**
 * Mobile bottom action sheet for map long-press. Anchored to the viewport
 * bottom (never under the finger), Drawer handles focus trap + backdrop +
 * ESC + outside-click dismissal. Items match MapContextMenuItem so the
 * desktop floating menu and this sheet stay in sync.
 */
export function MapActionSheet({ opened, title, items, onClose }: MapActionSheetProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withCloseButton={false}
      padding={0}
      styles={{
        // inner has position:fixed;inset:0 by default — override so it only
        // covers the bottom, letting the panel auto-size to its content.
        inner: { top: 'unset', height: 'auto' },
        content: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        },
      }}
    >
      {title && (
        <Text
          size="sm"
          c="dimmed"
          ta="center"
          py="xs"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          {title}
        </Text>
      )}
      <Stack gap={0} p={4} role="menu" aria-label={title ?? 'Map actions'}>
        {items.map(item => (
          <UnstyledButton
            key={item.label}
            role="menuitem"
            onClick={() => { item.onClick(); onClose(); }}
            style={{
              minHeight: 48,
              padding: '12px 20px',
              fontSize: 16,
              textAlign: 'left',
              color: item.danger ? 'var(--mantine-color-red-6)' : undefined,
              fontWeight: 500,
            }}
          >
            {item.label}
          </UnstyledButton>
        ))}
      </Stack>
    </Drawer>
  );
}
