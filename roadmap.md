# Cloudy Future Roadmap ☁️

This is a living document for all the things we want to polish or add later that aren't critical for the current vibe.

## 🚀 Engagement & Surface
*   **The "Sunrays" Widget (High Impact)**: Create a Home Screen Widget. If the user sees Cloudy on their home screen asking "What went well today?", they are much more likely to engage. Uses WidgetKit (iOS) and Android Widgets.

## 📊 Insights & Meaning
*   **Monthly Forecasts**: After 30 days, generate an insight summary. *"You mentioned 'Family' 12 times this month!"* or *"You've been feeling 20% more 'Zen' lately."* This turns data into knowledge.
*   **Weekly Highlights**: A special view in the history that picks the most "liked" or significant memories based on keywords or user favorites.
*   **Multi-Question Prompts**: Allow users to cycle through different gratitude prompts if they're feeling stuck on "What's on your mind?".

## 🔒 Trust & Security
*   **Local-First Persistence**: Ensure `JournalContext` handles offline saves gracefully so memories aren't lost during poor connectivity.

## ✨ Experience & Polish
*   **Dynamic Versioning**: Automate the version footer in the Profile screen to pull directly from `app.json` instead of being hardcoded. *(Already implemented in AppFooter.tsx)*
*   **"Shake to Reminisce"**: If the user shakes their phone while on the main screen, a random memory from the past floats down. It turns the phone into a "Snow Globe" of memories. Requires `expo-sensors`.

## 🎨 Creative Expression
*   **Custom Mascots**: Allow users to unlock or design their own companion varieties. Expand the gallery beyond the core set.
*   **Beautiful Share Cards - "Share to Instagram"**: Generate a beautiful square image with the gratitude text, the date, and a tiny Cloudy mascot in the corner. Don't just screenshot—create. This turns users into marketers. Requires `react-native-view-shot` and `expo-sharing`.

## 🌍 Internationalization
*   **i18n Framework Setup**: Integrate `i18next` and `react-i18next` for multi-language support.
*   **Translation Files**: Create JSON-based translation files for core languages (Spanish, French, German, Portuguese, Japanese, etc.).
*   **RTL Support**: Ensure layout supports right-to-left languages (Arabic, Hebrew).
*   **Locale Detection**: Auto-detect device language and apply appropriate translations.
*   **Date/Time Localization**: Format dates and times according to user's locale settings.


## 🛠️ Post-Launch & Productivity
*   **Create "Cloudy Core" Template**: Once Cloudy is fully polished and launched, extract the core architecture (Auth, Theme, Supabase, Navigation) into a clean, reusable GitHub Template Repository. This will serve as the "backbone" for future app ideas (like the "Impulse Purchase Lock" app).
    *   **Goal**: `npx create-cloudy-app` experience via a simple "Use this template" button on GitHub.

---

## ✅ Completed
*   **Biometric Lock (FaceID) - "Lock my Cloud"**: Adds an extra layer of privacy. Even if the phone is unlocked, Cloudy requires a biometric check (FaceID/Fingerprint) to open. Integrated with `expo-local-authentication` and features an instant-lock cache.
*   **Flashback Notifications**: Instead of just generic reminders, send nostalgic nudges: *"Remember what made you smile 3 months ago?"*. Tapping opens the Memory screen directly to that entry.
*   **Smarter Reminders**: Implement `expo-notifications`. Move beyond just database values—actually schedule local push notifications that respect the user's `reminder_time`.
*   **Standardized Haptic Language**: Implemented a consistent tactile experience across the entire app. Selection ticks for navigation/tabs, success pulses for alerts, and heavy impacts for "Commit" actions (Save/Logout/Delete). Combined with scale micro-animations for a premium feel. Respects the "Haptic Feedback" toggle.
*   **Privacy & Security Center**: Dedicated `LegalScreen` accessible from Profile, displaying privacy policy and terms.
*   **Security Hardening (Full Suite)**:
    *   End-to-End Encryption (AES-256-CBC) for all journal entries
    *   SecureStore for session persistence
    *   Snapshot Protection (Privacy overlay in App Switcher)
    *   Accessibility Guard (Content unmounted when locked)
    *   Android BackHandler Guard (Prevent lock screen bypass)
    *   Cold Start Zero-Frame Leakage Protection
    *   Grace Period Re-lock Logic (60s)
*   **Performance Optimization (Full Suite)**:
    *   Pagination with lazy loading
    *   FlatList optimizations (`getItemLayout`, `React.memo`, `windowSize`)
    *   Server-side `deleted_at` filtering
    *   Explicit column selection (no `SELECT *`)
    *   Pull-to-refresh with haptics
