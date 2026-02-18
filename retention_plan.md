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
| Mascot | Unlock | **The Perk (Reward)** | **Implementation Note** |
| :--- | :--- | :--- | :--- |
| **Sparky** | 0 Days | **Base Experience** | The standard Cloudy loop. |
| **Cookie** | 7 Days | **Insights Dashboard** | *"Unlock Cookie to see your stats."* <br> The entire `Insights` card is locked until the user hits 7 days once. |
| **Dreamy** | 14 Days | **"Cloudy Night" Theme** | *"Unlock Dreamy to enable Dark Mode."* <br> Permanent access to the Dark Mode theme. |
| **Brainy** | 30 Days | **Custom App Icons** | *"Unlock Brainy to customize your home screen."* <br> Access to Gold, Neon, and Pixel Art app icons. |
| **Sunny** | 60 Days | **Streak Freeze (Passive)** | Sunny automatically saves a lost streak once per month. |
| **Groovy** | 90 Days | **"Verified" Status** | A golden profile border/badge. Pure status symbol. |

---

## Part 2: The Stick (Smart Notification Protocol)
A dynamic schedule to remind users without annoying them, respecting their sleep schedule.

### The Algorithm: "Dynamic Rescue"
We divide the day into **Habit Time** (User Preference) and **Rescue Time** (System Safety Net).

#### 1. Phase 1: The Habit Nudge (User's Choice)
*   **Timing:** Triggers at `user.reminder_time`.
*   **Content:** Dynamic prompts based on streak status.
    *   *Standard:* "Time for your daily reflection? ☁️"
    *   *Near Unlock:* "Only 1 day left until you unlock Custom Icons! �"

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

## Summary of Action Items

1.  **Refactor `COMPANIONS`:** Add `unlock_perk` metadata.
2.  **Implement Locked Insights:** Update `Insights.tsx` to check `max_streak >= 7` (Permanent Unlock logic).
3.  **Enhance Notifications:**
    *   Update `scheduleDailyReminder` to handle "Late Night" logic.
    *   Update `scheduleRescueNotification` for the multi-stage nudges.
4.  **Custom Icons:**
    *   Add `expo-dynamic-app-icon` (or similar).
    *   Create asset placeholders for Gold/Neon/Pixel icons.
