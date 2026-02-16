# ⚡ Performance Audit & Optimization Plan

This document tracks identified performance bottlenecks and unnecessary request cycles in **Cloudy**.

## 🔍 Identified Issues

### 1. The `getUser()` Multi-Call (RESOLVED ✅)
*   **Problem:** Independent calls to `supabase.auth.getUser()` in `App.tsx`, `ProfileContext.tsx`, `JourneyScreen.tsx`, `HomeScreen.tsx`, and `ProfileScreen.tsx`.
*   **Impact:** Triggers network requests to Supabase auth server per call. Adds ~200-500ms latency on mobile per screen focus/setup.
*   **Fix:** Centralize auth state. Use the `session` from `App.tsx` or a dedicated `AuthContext`.

### 2. Duplicate Profile Fetching (RESOLVED ✅)
*   **Problem:** `JourneyScreen.tsx` manually queries the `profiles` table inside a `useFocusEffect`, ignoring the existing `ProfileContext`.
*   **Impact:** Redundant network request every time the Journey tab is focused.
*   **Fix:** Consume `profile` from `useProfile()` hook in `JourneyScreen`.

### 3. Soft-Delete Payload Growth (RESOLVED ✅)
*   **Problem:** Fetching all entries including soft-deleted ones and filtering on the client.
*   **Rationale:** `JournalContext.tsx` fetches `.select('*')` without server-side filtering.
*   **Impact:** Downloading unnecessary data (deleted memories) wastes bandwidth.
*   **Fix:** Add `.is('deleted_at', null)` to Supabase queries. Use a dedicated lightweight RPC if streak calculation needs deleted dates.

### 4. Scalability (Pagination) (RESOLVED ✅)
*   **Problem:** Loading the entire history in one go.
*   **Impact:** As a user grows their journal to 100+ entries, the initial fetch and JSON parsing will become slow.
*   **Fix:** 
    *   **Pagination:** Implement limit/offset or range-based pagination (e.g., fetch 20-30 at a time) using Supabase `.range()`.
    *   **Metadata Split:** Fetch **only** `created_at` and `id` for ALL entries on boot to calculate the streak without downloading full memory text.

### 5. Redundant Auth Listeners (RESOLVED ✅)
*   **Problem:** Duplicate `onAuthStateChange` listeners in `App.tsx` and `ProfileContext.tsx`.
*   **Impact:** Potential race conditions and dual-refetching of profile data on login/logout.
*   **Fix:** Centralize the auth listener in `App.tsx` and drive the Providers from the single source of truth.

### 6. Query Optimization (`*` Selects) (RESOLVED ✅)
*   **Problem:** Using `.select('*')` in multiple places.
*   **Impact:** Downloading redundant columns (like repeating `user_id` on every row).
*   **Fix:** Explicitly select only required columns: `id, text, is_favorite, created_at, deleted_at`.

### 7. List Rendering & Animations (RESOLVED ✅)
*   **Problem:** Fast scrolling through 50+ posts causes "jank" because of per-frame Reanimated style recalculations and `interpolateColor` operations.
*   **Fix:** 
    *   **FlashList Migration**: Replaced `Animated.FlatList` with `@shopify/flash-list` for better recycling and elimination of blank cells.
    *   **Simplified Animations**: Removed scroll-linked `interpolateColor` and per-frame opacity calculations. Kept only delete animations.
    *   **Memoization**: `TimelineItem` wrapped in `React.memo` with proper comparison function.

## 🛠️ Performance Checklist
- [x] Centralize `getUser()` / `userId` access.
- [x] Migrate `JourneyScreen` to use `ProfileContext`.
- [x] Move `deleted_at` filtering to server-side query.
- [x] Implement pagination in `JournalContext`.
- [x] Audit all `.select('*')` calls.
- [x] Migrate to FlashList with `estimatedItemSize={180}`.
- [x] Remove scroll-linked color interpolation for smoother scrolling.
- [x] Wrap `TimelineItem` in `React.memo` for render optimization.
- [x] Add pull-to-refresh with `haptics.light()`.
