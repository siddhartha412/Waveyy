# Fix Plan: 5 New Layout Issues

## Issue 1: Right sidebar still overlapping with main content

**Root cause:** The right sidebar has `m-2` (8px margin), so its border box left edge is at `viewport - 368px`. But the content wrapper only has `lg:pr-[360px]`, so the content area extends to `viewport - 360px` — 8px past the sidebar's left edge. This creates overlap.

**Fix:** In `layout.jsx:25-27`, change right padding from `360px` to `368px` to account for the sidebar's 8px margin:
```
- "lg:pr-[360px]"
+ "lg:pr-[368px]"
```

Also update the player bar `right` value in `player.jsx:510` from `362px` to `368px` to stay aligned:
```
- left-[282px] right-[362px] h-[96px] bottom-2 mx-2
+ left-[282px] right-[368px] h-[96px] bottom-2 mx-2
```

## Issue 2: Color leaking between Popular Artists cards

**Root cause:** The section has `bg-secondary/20` (20% opacity), which is very transparent. The page's gradient background shows through the gaps between the horizontally scrolling cards, creating a "leaking" effect.

**Fix:** In `page.js:567-571`, increase the section background opacity from `bg-secondary/20` to `bg-secondary/30` in `trendingSectionClass`. This makes the background more opaque, reducing the gradient bleed-through in card gaps.

## Issue 3: Trending Now should have rounded corners at the top

**Root cause:** The Trending Now section has `rounded-2xl` but no `overflow-hidden`. The global gradient background (`z-0`) paints behind the section, and the section's semi-transparent `bg-secondary/20` lets the gradient show through at the top corners, making them appear unrounded.

**Fix:** In `page.js:567-571`, add `overflow-hidden` to `trendingSectionClass` so the section's content is properly clipped to its rounded corners.

## Issue 4: Player bar icons overflow on screen resize

**Root cause:** The player bar's right section has `w-1/4 min-w-[100px]`, but three buttons (fullscreen, loop, close) need ~132px. On narrower screens the section compresses and icons overflow.

**Fix:** In `player.jsx:636`, change `min-w-[100px]` to `min-w-[130px]` and add `shrink-0` to prevent the right section from compressing below its content size.

## Issue 5: Player bar width should match sections

**Root cause:** The player bar uses `right-[362px]` which is 2px off from the content wrapper's `pr-[360px]` (now `pr-[368px]`). This creates asymmetric margins.

**Fix:** Already addressed in Issue 1 by changing `right-[362px]` to `right-[368px]`. With `mx-2`, the player bar gets symmetric 8px inset on both sides, matching the content area boundaries while staying visually contained within the sections.

---

## Files to modify

| File | Lines | Change |
|------|-------|--------|
| `app/(root)/layout.jsx` | 25-27 | Right padding `360px` → `368px` |
| `components/cards/player.jsx` | 510 | `right-[362px]` → `right-[368px]` |
| `components/cards/player.jsx` | 636 | `min-w-[100px]` → `min-w-[130px]`, add `shrink-0` |
| `app/(root)/page.js` | 567-571 | Add `overflow-hidden`, increase `bg-secondary/20` → `bg-secondary/30` |
