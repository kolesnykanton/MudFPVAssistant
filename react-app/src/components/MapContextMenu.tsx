import { useEffect, useRef } from 'react';
import { Button, Paper, Stack } from '@mantine/core';

export interface MapContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface MapContextMenuProps {
  left: number;
  top: number;
  width: number;
  items: MapContextMenuItem[];
}

/**
 * Right-click / long-press context menu for the map.
 *
 * Implements the WAI-ARIA Menu pattern: role="menu" with role="menuitem"
 * children, ArrowUp/Down cycling, Home/End jumping, and auto-focus on open.
 * Escape is handled by the parent (also dismisses the menu).
 */
export default function MapContextMenu({ left, top, width, items }: MapContextMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the first menu item so keyboard users can navigate immediately.
    const first = containerRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    first?.focus();
  }, [items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
    );
    if (buttons.length === 0) return;
    const currentIndex = buttons.findIndex(b => b === document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        buttons[(currentIndex + 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        buttons[(currentIndex - 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
    }
  };

  return (
    <Paper
      ref={containerRef}
      withBorder
      shadow="md"
      role="menu"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 1001,
        minWidth: width,
        padding: '4px 0',
        overflow: 'hidden',
      }}
    >
      <Stack gap={0}>
        {items.map(item => (
          <Button
            key={item.label}
            role="menuitem"
            variant="subtle"
            color={item.danger ? 'red' : undefined}
            size="sm"
            justify="start"
            fullWidth
            style={{ borderRadius: 0 }}
            onClick={item.onClick}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}
