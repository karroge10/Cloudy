# The Cloudy Retention Plan: "Carrot, Stick & Rescue"
> **Objective:** Boost daily active users (DAU) by transforming mascots from cosmetic images into functional power-ups and implementing a smart, non-intrusive notification strategy.

---

## Part 1: The Carrot (Mascot Progression System)
We gate specific, high-value app features behind mascot unlocks to create "Habit Milestones."

### 1. The Strategy: "Permanent Unlocks" (The Badge of Honor)
**Decision:** Once a mascot is unlocked, it is **Permanent**. 
*   **Why?** Taking away features feels like punishment and breeds resentment. Losing the *streak count* is painful enough. Keeping the unlock is a "Badge of Honor" – "I earned this."
*   **The Incentive:** The drive is to unlock the *next* mascot, not to keep the current one. The "pain" of losing a streak is having to restart the climb to the *next* tier.

### 2. The Progression Ladder
| Mascot | Rank | Unlock | **The Reward** | **Implementation Note** |
| :--- | :--- | :--- | :--- | :--- |
| **Sunny** | Beginner | 1 Day | **Base Experience** | Planting the first seeds. The standard loop. |
| **Brainy** | Regular | 7 Days | **Insights Dashboard** | Analyze your mind with personal insights. |
| **Dreamy** | Expert | 14 Days | **Streak Freeze** | Saves your streak once per month (Passive). |
| **Cookie** | Master | 30 Days | **Chef's Special: Memory Mix** | A delicious mix of your past memories. |
| **Groovy** | Legend | 60 Days | **Custom App Icons** | Premium icons for the home screen. |
| **Sparky** | **HERO** | 90 Days | **"Verified" Status** | The Ultimate Hero. Golden badge & Verified Rank. |

---

## Part 2: The Stick (Smart Notification Protocol)
A dynamic schedule to remind users without annoying them, respecting their sleep schedule.

### The Algorithm: "Dynamic Rescue"
We divide the day into **Habit Time** (User Preference) and **Rescue Time** (System Safety Net).

#### 1. Phase 1: The Habit Nudge (User's Choice)
*   **Timing:** Triggers at `user.reminder_time`.
*   **Content:** Dynamic prompts based on streak status.
    *   *Standard:* "Time for your daily reflection? ☁️"
    *   *Near Unlock:* "Only 1 day left until you unlock Custom Icons! "

#### 2. Phase 2: The Streak Rescue (The System's Stick)
*   **Logic:**
    *   **IF** `user.reminder_time` < 20:00 (8 PM): Schedule Rescue at **22:00 (10 PM)**.
    *   **IF** `user.reminder_time` >= 20:00 (8 PM): **Skip Rescue**. The user's own reminder serves as the "Last Call."
*   **Content:** High-urgency, loss-aversion.
    *   *"Cloudy is worried... ☁️ posted today? Your streak resets in 2 hours!"*

---

## Part 3: The Rescue System (Re-engagement)
A robust protocol to bring back users who have "fallen off the wagon." This enhances the existing 3-day nudge.

### The "Fading Memory" Protocol (Multi-Stage)
We use a progressive sequence of notifications to gently pull inactive users back.

| Inactivity | **Theme** | **Notification Content** | **Logic** |
| :--- | :--- | :--- | :--- |
| **Day 3** | Gentle | *"We miss your thoughts! ☁️ No pressure, just wanted to say hi."* | Existing `rescue-nudge`. |
| **Day 7** | Emotional | *"Sparky is feeling lonely... 🥺 It's been a week since we talked."* | Triggered if streak is 0 for 7 days. |
| **Day 14** | Nostalgia | *"Remember this? 📸 You wrote a memory 2 weeks ago. Tap to read."* | Flashback to the last entry they made. |
| **Day 30** | Fresh Start | *"A fresh month, a fresh start? 🌟 Come back and begin a new journey."* | Positive reinforcement to restart. |

---

## Part 4: Technical Implementation Guide

### 1. Data Structure Updates
**File:** `src/constants/Companions.ts`
*   Add `unlockPerk` field to the `Companion` type.
*   Update `COMPANIONS` array to include the specific text for each perk.

```typescript
export interface Companion {
    // ... existing fields
    unlockPerk: string; // e.g. "Insights Dashboard"
    unlockPerkDescription: string; // e.g. "Unlock Cookie to see your stats."
}
```

### 2. Feature Gating Logic
**File:** `src/components/Insights.tsx`
*   Wrap the main content of `Insights.tsx` in a conditional.
*   **Logic:** `const isInsightsUnlocked = (profile?.max_streak || 0) >= 7;`
*   **Locked State:** value-prop card showing "Unlock at 7 Day Streak" with a blurred preview or padlock icon.

**File:** `src/screens/ProfileScreen.tsx`
*   Update `MascotCard`: Show the `unlockPerk` in the UI when locked/unlocked to make the reward visible.
*   "Custom App Icons" & "Themes": These will need new Contexts or simple state checks in `SettingsScreen` (future task), but for now, we advertise them in the Mascot list.

### 3. Smart Notification Logic
**File:** `src/utils/notifications.ts`
*   **`scheduleDailyReminder`**:
    *   Check `user.reminder_time`.
    *   If `reminder_time < 20:00`, schedule a second "Rescue" notification at `22:00` (Safety Net).
    *   If `reminder_time >= 20:00`, do *not* schedule the Safety Net (avoid spamming late at night).
*   **`scheduleRescueNudges`** (New Function):
    *   Run this on app background/close.
    *   Schedule notifications for Day 3, 7, 14, 30 from *now*.
    *   **critical:** Cancel these pending notifications immediately when the user opens the app/logs an entry.

---

## Part 5: Success Metrics & Analytics

To verify this plan works, we will track the following events:

| Event Name | Property | Purpose |
| :--- | :--- | :--- |
| `mascot_unlocked` | `mascot_name` | Track how many users reach each tier. |
| `feature_access_denied` | `feature: "insights"` | Measure desire/intent for locked features. |
| `rescue_notification_sent` | `stage: "day_7"` | Track volume of churned users. |
| `app_opened_via_notification` | `type: "rescue"` | Measure effectiveness of the "Stick". |
| `streak_rescued` | `method: "sunny_perk"` | Track usage of the "Sunny" passive ability. |

---

- [x] **Phase 1: Structure**
    - [x] Update `Companions.ts` with perk data.
    - [x] Create `LockedFeature` component (reusable UI).
- [x] **Phase 2: The Carrot (UI)**
    - [x] Implement locking logic in `Insights.tsx`.
    - [x] Update `ProfileScreen` to show perks in Mascot cards.
    - [x] Redesign `ProgressScreen` for premium reward visibility.
- [x] **Phase 3: The Stick (Notifications)**
    - [x] Implement `scheduleRescueNudges` (3, 7, 14, 30 days).
    - [x] Update daily reminder logic for "Safety Net".
- [x] **Phase 4: Functional Perks (Next Steps)**
    - [x] **Insights (Brainy):** Gated at 7 days. Done.
    - [x] **Dark Mode (Universal):** Unlocked for everyone.
    - [x] **Streak Freeze (Dreamy):** Logic in `JournalContext` for auto-recovery (14 days).
    - [x] **Memory Mix (Cookie):** Chef's special feature (30 days).
    - [x] **Custom Icons (Groovy):** Native module implementation for dynamic icon switching.
    - [x] **Verified Status (Sparky):** UI badges in Profile.

---

## Technical Note: Perk Validation
To make these rewards "real," we will use the `max_streak` field as the source of truth.
*   **Insights:** Gated in `Insights.tsx` via `max_streak >= 7` (Brainy).
*   **Streak Freeze:** Automated in `useJournal` via `max_streak >= 14` (Dreamy).
*   **Memory Mix:** Dedicated dashboard (MemoryMixScreen) via `max_streak >= 30` (Cookie). Featuring Daily Specials, First Courses, and unique history stats.
*   **Icons:** Gated in `IconSettings` via `max_streak >= 60` (Groovy).
*   **Verification:** Conditional badge in `ProfileScreen` via `max_streak >= 90` (Sparky).
