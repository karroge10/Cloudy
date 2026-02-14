# Cloudy Future Roadmap ☁️

This is a living document for all the things we want to polish or add later that aren't critical for the current vibe.

## 🚀 Engagement & Surface
*   **The "Sunrays" Widget (High Impact)**: Create a Home Screen Widget. If the user sees Cloudy on their home screen asking "What went well today?", they are much more likely to engage. Uses WidgetKit (iOS) and Android Widgets.

## 📊 Insights & Meaning
*   **Monthly Forecasts**: After 30 days, generate an insight summary. *"You mentioned 'Family' 12 times this month!"* or *"You've been feeling 20% more 'Zen' lately."* This turns data into knowledge.
*   **Weekly Highlights**: A special view in the history that picks the most "liked" or significant memories based on keywords or user favorites.
*   **Multi-Question Prompts**: Allow users to cycle through different gratitude prompts if they're feeling stuck on "What's on your mind?".

## 🔒 Trust & Security
*   **Privacy & Security Center**: Build out the dedicated screen for managing data, learning about our encryption, and controlling account settings.
*   **Local-First Persistence**: Ensure `JournalContext` handles offline saves gracefully so memories aren't lost during poor connectivity.

### 🛡️ Security Hardening (Security Audit Findings)
*   **[Snapshot Protection]** Obscure the app immediately when it becomes `inactive` or `background`. Prevents the journal from being visible in the OS App Switcher.
*   **[Accessibility Guard]** Unmount app content when locked. Currently, the content renders *behind* the overlay, meaning screen readers (TalkBack/VoiceOver) can still "read" the obscured text.
*   **[App Lifecycle Logic]** Fix the `LockScreen` session logic to ensure it doesn't bypass biometrics if the Supabase session is briefly nullified during a background transition.
*   **[Android Back Button]** Implement a `BackHandler` override to prevent users from "backing out" of the lock screen into the previous app state.
*   **[Cold Start Race Condition]** Optimize `isBioLocked` initialization in `App.tsx` to ensure zero-frame leakage of content before the lock overlay mounts.

## ✨ Experience & Polish
*   **Export as PDF**: The button is in the Profile, but it needs an engine. Use `expo-print` to generate beautiful, themed layouts of the user's journal for printing or backup.
*   **Dynamic Versioning**: Automate the version footer in the Profile screen to pull directly from `app.json` instead of being hardcoded.
*   **"Shake to Reminisce"**: If the user shakes their phone while on the main screen, a random memory from the past floats down. It turns the phone into a "Snow Globe" of memories. Requires `expo-sensors`.

## 🎨 Creative Expression
*   **Custom Mascots**: Allow users to unlock or design their own companion varieties. Expand the gallery beyond the core set.
*   **Beautiful Share Cards - "Share to Instagram"**: Generate a beautiful square image with the gratitude text, the date, and a tiny Cloudy mascot in the corner. Don't just screenshot—create. This turns users into marketers. Requires `react-native-view-shot` and `expo-sharing`.

## ⚡ Performance & Refactoring
*   **Request Lifecycle Audit**: Clean up redundant `getUser()` and `profiles` table fetches. See [PERFORMANCE.md](./PERFORMANCE.md) for the full checklist.
*   **Pagination Implementation**: Move from "Fetch All" to a windowed loading approach for better scalability.


---

## ✅ Completed
*   **Biometric Lock (FaceID) - "Lock my Cloud"**: Adds an extra layer of privacy. Even if the phone is unlocked, Cloudy requires a biometric check (FaceID/Fingerprint) to open. Integrated with `expo-local-authentication` and features an instant-lock cache.
*   **Flashback Notifications**: Instead of just generic reminders, send nostalgic nudges: *"Remember what made you smile 3 months ago?"*. Tapping opens the Memory screen directly to that entry.
*   **Smarter Reminders**: Implement `expo-notifications`. Move beyond just database values—actually schedule local push notifications that respect the user's `reminder_time`.
*   **Standardized Haptic Language**: Implemented a consistent tactile experience across the entire app. Selection ticks for navigation/tabs, success pulses for alerts, and heavy impacts for "Commit" actions (Save/Logout/Delete). Combined with scale micro-animations for a premium feel. Respects the "Haptic Feedback" toggle.
