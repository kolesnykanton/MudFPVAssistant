import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useFloating, offset, flip, shift,
  useDismiss, useRole, useListNavigation, useInteractions,
  FloatingFocusManager, FloatingPortal,
} from '@floating-ui/react';
import { Button, Paper, Stack } from '@mantine/core';

export interface MapContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface MapContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  width?: number;
  items: MapContextMenuItem[];
  onClose: () => void;
}

/**
 * Desktop right-click menu for the map.
 *
 * Positions itself at (x, y) via a virtual reference. floating-ui hooks
 * provide dismissal (Esc + outside-press), focus trap, and arrow-key list
 * navigation — no manual backdrop, keydown handler, or focus effect needed.
 */
export default function MapContextMenu({
  open, x, y, width = 170, items, onClose,
}: MapContextMenuProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const listRef = useRef<Array<HTMLButtonElement | null>>([]);

  const middleware = useMemo(() => [offset(4), flip(), shift({ padding: 8 })], []);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => { if (!next) onClose(); },
    placement: 'bottom-start',
    middleware,
  });

  // Virtual reference at the click point. setPositionReference must run in an
  // effect (not during render) to satisfy react-hooks/refs.
  useEffect(() => {
    refs.setPositionReference({
      getBoundingClientRect: () => ({
        x, y, top: y, left: x, right: x, bottom: y, width: 0, height: 0,
        toJSON: () => ({}),
      }),
    });
  }, [x, y, refs]);

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
    focusItemOnOpen: 'auto',
  });
  const { getFloatingProps, getItemProps } = useInteractions([dismiss, role, listNav]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false} initialFocus={0}>
        <Paper
          // setFloating is a callback ref from useFloating — standard pattern.
          // eslint-disable-next-line react-hooks/refs
          ref={refs.setFloating}
          withBorder
          shadow="md"
          style={{
            ...floatingStyles,
            zIndex: 1001,
            minWidth: width,
            padding: '4px 0',
            overflow: 'hidden',
          }}
          {...getFloatingProps()}
        >
          <Stack gap={0}>
            {items.map((item, i) => (
              <Button
                key={item.label}
                ref={(node) => { listRef.current[i] = node; }}
                variant="subtle"
                color={item.danger ? 'red' : undefined}
                size="sm"
                justify="start"
                fullWidth
                style={{ borderRadius: 0 }}
                {...getItemProps({
                  onClick: () => { item.onClick(); onClose(); },
                })}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Paper>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}
