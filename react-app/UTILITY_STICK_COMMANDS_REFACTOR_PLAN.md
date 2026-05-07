# Utility Page Stick Commands Refactor Plan

## Scope Reviewed
- `src/pages/Utilities.tsx`
- `src/components/OsdCommandPanel.tsx`
- `src/components/StickAnimation.tsx`

## Current-State Findings

1. **Data model is inline and weakly typed**
   - `OSD_COMMANDS` is declared directly in the page file and uses stringly-typed `left/right` segment values.
   - This does not scale for i18n, categories, search, de-duplication, or future command metadata.

2. **Layout is responsive but not tokenized and not content-aware**
   - Uses static `Grid.Col` spans with fixed breakpoints.
   - No container max-width strategy, no command density options, and no compact mode for small screens.

3. **Component boundaries are good but too presentation-focused**
   - `OsdCommandPanel` only renders visuals and title.
   - There is no reusable command-card pattern with actions (copy/expand/favorite/share) or accessibility guidance text.

4. **Animation strategy is potentially expensive at scale**
   - Each card mounts its own Lottie instance (2 per card), which can be heavy on low-power devices.
   - No reduced-motion fallback and no visibility-based pause/unmount.

5. **Accessibility and UX standards partially covered**
   - Images have ARIA labels, but command cards lack semantic landmarks and keyboard affordances.
   - Accordion is fine, but there is no quick navigation, filtering, or command discovery support.

## Refactor Goals
- Scalable command architecture that supports growth (metadata, grouping, localization).
- Mobile-first and desktop-friendly responsive behavior using standard UI patterns.
- Better accessibility (WCAG-aligned semantics, reduced motion handling, keyboard support).
- Performance-aware rendering for many command cards.

## Proposed Architecture

### 1) Extract domain model and constants
Create:
- `src/features/utilities/commands/types.ts`
- `src/features/utilities/commands/data.ts`

Model:
- `CommandSegment` union type from known keys.
- `StickCommand` interface:
  - `id`, `label`, `category`, `leftSegment`, `rightSegment`, optional `description`, `tags`.

Benefits:
- Type safety, easier testing, clean separation of content from UI.

### 2) Compose feature-level components
Create:
- `src/features/utilities/components/StickCommandGrid.tsx`
- `src/features/utilities/components/StickCommandCard.tsx`
- `src/features/utilities/components/ConfiguratorLinks.tsx`

Keep page as orchestration-only:
- `Utilities.tsx` should provide layout shell, section headings, and feature composition.

### 3) Responsive UI pattern (standard)
Adopt common pattern:
- `Container` with responsive `size` and consistent horizontal padding.
- Command grid with `SimpleGrid` and `cols` by breakpoint (`1/2/3/4`).
- Card min-height and equal-height title area for visual rhythm.
- Optional segmented control: `All | OSD | Profiles`.

### 4) Accessibility upgrades
- Each card uses semantic article structure (`role="group"`, labeled by heading).
- Add human-readable instruction text below animations.
- Add `prefers-reduced-motion` support in `StickAnimation` to render static endpoint frame.
- Ensure link list in configurators has clear external-link labels.

### 5) Performance strategy
- Memoize `StickCommandCard` and `StickAnimation` props.
- Pause animations when offscreen via `IntersectionObserver`.
- Optional static SVG fallback on small screens or reduced motion.

### 6) Styling standards
- Move inline styles to CSS module or Mantine `createStyles` pattern.
- Use spacing/typography tokens from Mantine theme.
- Keep dark/light contrast compliant for text and icon strokes.

## Suggested Implementation Phases

### Phase 1 (safe structural refactor)
- Extract typed command data + feature folders.
- Replace `Grid` with `Container + SimpleGrid`.
- Keep current visuals unchanged.

### Phase 2 (UX and accessibility)
- Add card descriptions + optional category filter.
- Improve semantics, keyboard, and reduced-motion behavior.

### Phase 3 (performance hardening)
- Introduce animation pausing/offscreen policy.
- Add fallback static mode and measure render cost.

## Acceptance Criteria
- Page remains functionally equivalent after Phase 1.
- Layout supports 320px width without overflow.
- At >=1200px, cards display in 4 columns with consistent spacing.
- Reduced-motion users see non-looping/static behavior.
- Lighthouse accessibility score improves or remains >= prior baseline.

## Test Checklist
- Manual viewport checks: 320, 375, 768, 1024, 1440 widths.
- Keyboard navigation through accordion, cards, and links.
- Color-scheme verification (light/dark).
- Reduced-motion OS setting validation.
- Basic render performance check with React Profiler.
