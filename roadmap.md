# Cloudy Future Roadmap ☁️

This is a living document for all the things we want to polish or add later that aren't critical for the current vibe.

## 🚀 Engagement & Surface
*   **The "Sunrays" Widget (High Impact)**: Create a Home Screen Widget. If the user sees Cloudy on their home screen asking "What went well today?", they are much more likely to engage. Uses WidgetKit (iOS) and Android Widgets.
*   **Flashback Notifications**: Instead of just generic reminders, send nostalgic nudges: *"Remember what made you smile 3 months ago?"*. Tapping opens the Memory screen directly to that entry.
*   **Smarter Reminders**: Implement `expo-notifications`. Move beyond just database values—actually schedule local push notifications that respect the user's `reminder_time`.

## 📊 Insights & Meaning
*   **Monthly Forecasts**: After 30 days, generate an insight summary. *"You mentioned 'Family' 12 times this month!"* or *"You've been feeling 20% more 'Zen' lately."* This turns data into knowledge.
*   **Weekly Highlights**: A special view in the history that picks the most "liked" or significant memories based on keywords or user favorites.
*   **Multi-Question Prompts**: Allow users to cycle through different gratitude prompts if they're feeling stuck on "What's on your mind?".

## 🔒 Trust & Security
*   **Security Lock**: Implement biometric (FaceID/Passcode) protection using `expo-local-authentication`. The UI toggle exists in the DB but needs to be wired to a splash interceptor.
*   **Privacy & Security Center**: Build out the dedicated screen for managing data, learning about our encryption, and controlling account settings.
*   **Local-First Persistence**: Ensure `JournalContext` handles offline saves gracefully so memories aren't lost during poor connectivity.

## ✨ Experience & Polish
*   **Export as PDF**: The button is in the Profile, but it needs an engine. Use `expo-print` to generate beautiful, themed layouts of the user's journal for printing or backup.
*   **Haptic Engine**: Create a global haptic utility that respects the "Haptic Feedback" toggle. Currently, vibrations fire regardless of the user's preference in settings.
*   **Dynamic Versioning**: Automate the version footer in the Profile screen to pull directly from `app.json` instead of being hardcoded.

## 🎨 Creative Expression
*   **Photo Attachments**: Let users snap a photo of their "small win" to accompany their text entries. Requires `posts` table update and Supabase Storage integration.
*   **Custom Mascots**: Allow users to unlock or design their own companion varieties. Expand the gallery beyond the core set.
