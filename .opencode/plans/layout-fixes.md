# Fix Plan: Layout Alignment and Spacing Issues

## Issue 1: Welcome card bottom should align with player bottom

**Root cause:** The left sidebar (`sidebar-nav.jsx:78`) has height `h-[calc(100vh-84px)]` with `m-2`. Its bottom edge is at `100vh - 8px` (8px from viewport bottom due to margin). The player bar (`player.jsx:510`) has `bottom-2 h-[96px]`, so its bottom is at 8px from viewport bottom. The sidebar's content area bottom is at `100vh - 92px` (92px from bottom), which is 84px above the player bottom.

**Fix:** Change sidebar height from `h-[calc(100vh-84px)]` to `h-[calc(100vh-100px)]` in `sidebar-nav.jsx:78`. This makes the sidebar border box bottom land at `100vh - 8px`, matching the player bottom.

**File:** `components/page/sidebar-nav.jsx` line 78
```
- h-[calc(100vh-84px)]
+ h-[calc(100vh-100px)]
```

---

## Issue 2: Welcome card too large - make it compact

**Root cause:** The card in `user-panel.jsx` uses `p-3` padding, `h-9 w-9` avatar, `gap-3` spacing, and `mt-3` margin before buttons.

**Fix:** Reduce padding, avatar size, gaps, and margins.

**File:** `components/page/user-panel.jsx`

Changes (loading, not-logged-in, logged-in variants):
- Card padding: `p-3` -> `p-2.5`
- Avatar size: `h-9 w-9` -> `h-8 w-8`
- Avatar-text gap: `gap-3` -> `gap-2.5`
- Content-to-buttons margin: `mt-3` -> `mt-2`

---

## Issue 3: Trending Now overlaps lyrics/queue panel

**Root cause:** The trending section uses `lg:-mx-32` (128px negative margin both sides). The content wrapper has `lg:pr-[360px]` when music plays. The trending section extends 128px right of the content area, overlapping the right sidebar by 136px.

**Fix:** Conditionally apply right negative margin only when right sidebar is NOT visible.

**File:** `app/(root)/page.js` lines 567-569

```jsx
const trendingSectionClass = user
    ? `mt-8 relative px-6 py-5 md:px-20 lg:px-32 rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-sm ${
        music ? "-mx-6 md:-mx-20 lg:-ml-32" : "-mx-6 md:-mx-20 lg:-mx-32"
      }`
    : "mt-2 relative w-full pt-5 pb-3 rounded-2xl border border-border/60 bg-secondary/20";
```

---

## Issue 4: Lyrics/queue panel bottom should align with player bottom

**Root cause:** Right sidebar has `h-[calc(100vh-84px-100px)]` with `m-2`. Bottom at 92px from viewport bottom. Player bottom at 8px. Sidebar is 84px too short.

**Fix:** Change to `h-[calc(100vh-100px)]`.

**File:** `components/cards/player.jsx` line 500
```
- h-[calc(100vh-84px-100px)]
+ h-[calc(100vh-100px)]
```

---

## Files to modify

| File | Lines | Change |
|------|-------|--------|
| `components/page/sidebar-nav.jsx` | 78 | Sidebar height adjustment |
| `components/page/user-panel.jsx` | 41,43,59-68,100-118 | Compact card styling |
| `app/(root)/page.js` | 567-569 | Conditional trending margins |
| `components/cards/player.jsx` | 500 | Right sidebar height adjustment |
