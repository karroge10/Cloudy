# Combining Achievements & Path of Mind

## Current State
We have two separate places showing user progress:
1. **Achievements** (Profile Screen) - Shows milestone trophies
2. **Path of Mind** (Separate Screen) - Shows mascot unlock progress

## Proposed Solution: Unified Progress Screen

### "Path of Mind" Screen Redesign

**Top Section: Your Journey**
- Current streak display
- Total entries count
- Current mascot (large, animated)

**Middle Section: Companions** (Grid Layout)
- 2-column grid of all 6 mascots
- Each shows:
  - Mascot image (grayed out if locked)
  - Name
  - Unlock requirement (e.g., "7 day streak")
  - Lock icon or "Unlocked" badge
- Tap to select (if unlocked)

**Bottom Section: Achievements** (Grid Layout)
- Same 2-column grid as current bottom sheet
- Shows all 5 achievements
- Each displays:
  - Mascot image representing the achievement
  - Achievement name
  - Description
  - Unlock status

### Benefits
1. **Single source of truth** for all progress
2. **Better visual hierarchy** - see everything at once
3. **More engaging** - combines mascots with achievements
4. **Cleaner navigation** - one less bottom sheet
5. **Consistent design** - all progress in one place

### Implementation Notes
- Remove Achievements card from ProfileScreen
- Expand PathOfMindScreen to include achievements section
- Keep the same grid layout (2 columns)
- Use ScrollView for the entire screen
- Add pull-to-refresh

### Open Questions
1. Should we rename "Path of Mind" to something more comprehensive like "Progress" or "Journey"?
2. Should achievements use the same mascot images or different ones?
3. Do we want any animations when unlocking?

## Next Steps
1. Review this proposal
2. Design the unified screen layout
3. Implement the combined screen
4. Remove redundant Achievements component from Profile
