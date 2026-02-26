# Google Play Store Listing Drafts

## ☁️ Cloudy (Current Version)

### App Title (max 30 symbols)
`Cloudy: Gratitude Journal`

### Short Description (max 80 symbols)
`A mindful space for your daily memories. Private, secure, and personal.`

### Full Description (max 4000 symbols)
**Find Your Peace, One Memory at a Time.**

Cloudy is more than just a journal—it’s your tiny companion for a clearer mind. In a world that moves too fast, Cloudy helps you slow down, focus on the good, and cultivate a habit of gratitude that lasts.

**✨ KEY FEATURES**

*   **Daily Mindfulness**: Capture what you’re grateful for in just a few seconds. Simple, elegant, and distraction-free.
*   **Meet Your Companions**: You’re not alone on this journey. Grow alongside friends like Sunny, Brainy, and Dreamy as you maintain your streak.
*   **Privacy You Can Trust**: Your memories are for your eyes only. Cloudy features biometric security (FaceID/Fingerprint) and state-of-the-art AES-256 encryption.
*   **Nostalgic Flashbacks**: Let Cloudy surprise you with memories from your past. Relive your happy moments and see how far you’ve come.
*   **Deep Insights**: Understand your writing patterns and moods with personalized analytics that help you see the "numerical patterns of your story."
*   **Personalized Vibe**: Choose an accent color that matches your energy and switch between calming light and dark themes.

**🔒 SECURITY & PRIVACY FIRST**
Cloudy is built with security at its core. We don't just lock your cloud; we encrypt it.
*   End-to-End Encryption for all entries.
*   SecureStore session persistence.
*   Snapshot Protection to keep your content hidden in the app switcher.

**🌟 WHY CLOUDY?**
Research shows that writing down just one gratitude a day can reduce stress, improve sleep, and increase overall happiness. Cloudy makes this habit easy, beautiful, and rewarding.

**Join thousands of others on a journey to a clearer mind. Start your cloud today.**

---

## 🐕 Walter (Rebranded Version)

*(Note: If you decide to pull the trigger on the rebranding, here is the Walter-specific copy)*

### App Title (max 30 symbols)
`Walter: Your Gratitude Companion`

### Short Description (max 80 symbols)
`Your faithful companion for daily mindfulness. Private, secure, and beautiful.`

### Full Description (max 4000 symbols)
**Meet Walter—Your Faithful Companion for a Clearer Mind.**

Walter is a mindful space designed to help you capture your daily memories and practice gratitude. Like a loyal friend, Walter is always there to remind you of the good things in your life and help you find your peace.

**✨ KEY FEATURES**

*   **Daily Gratitude**: Write down what made you smile today. Walter keeps your thoughts safe and organized.
*   **Charming Companions**: Progress through your journey and unlock new friends to join Walter on your dashboard.
*   **Bank-Level Security**: Your privacy is our priority. Walter uses biometric locking and full AES-256 encryption to ensure your journal stays yours.
*   **Daily speciale & Flashbacks**: Walter loves to reminisce! Enjoy curated blends of your past memories to brighten your day.
*   **Personal Insights**: Watch your mental growth with detailed stats on your writing rhythm and themes.
*   **Customizable Experience**: Tailor Walter’s appearance to your mood with beautiful accent colors and a sleek dark mode.

**🔒 BUILT FOR TRUST**
*   Full End-to-End Encryption.
*   Biometric protection (FaceID/Fingerprint).
*   Cold start leakage protection.

**Why Walter?**
Practicing gratitude for just two minutes a day can transform your outlook on life. Walter makes it simple, tactile, and fun to build a habit that supports your mental well-being.

**Ready for a fresh start? Let Walter guide you to a more mindful tomorrow.**

---

## 🔒 Data Safety Questionnaire (Draft)

When submitting to the Google Play Console, you will need to answer the Data Safety Section. Here is a draft based on the current app implementation:

**1. Data Collection & Sharing**
*   **Does your app collect or share any of the required user data types?** Yes.
*   **Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS/TLS).
*   **Do you provide a way for users to request that their data be deleted?** Yes (implemented in Settings).

**2. Data Types Collected**
*   **Personal Information**:
    *   **Email address**: Collected via Supabase Auth for account functionality and sync.
    *   **Name**: Collected optionally to personalize the experience.
*   **App Activity**:
    *   **App interactions**: Tracked via **PostHog** (page views, button clicks) to improve the app.
*   **Device or other IDs**:
    *   **Device ID**: Tracked via PostHog for analytics.

**3. Specific Security Claims**
*   **End-to-End Encryption**: You can honestly claim that user journal entries are encrypted on the device before being sent to the cloud. The server does not have the key to read them.

---

## 🖼️ Store Asset Requirements

To complete your listing, you'll need the following assets:

### 1. App Icon (512 x 512) - **REQUIRED**
*   32-bit PNG (with alpha).
*   This is what users see on their home screen.

### 2. Feature Graphic (1024 x 500) - **REQUIRED**
*   **The "Movie Poster":** DO NOT use a screenshot. Use a beautiful, colorful background with your mascot (Shine or Zen) and the app name in the center.
*   **Pro-Tip (The Safe Zone):** Keep all logos and mascots in the center 70% of the image. Google often crops the edges on different devices!
*   Google uses this to feature your app in the "Special for you" sections.

### 3. Phone Screenshots - **REQUIRED**
*   At least 2, up to 8.
*   Show the **Welcome Screen**, the **Journal Entry**, and the **Insights** screen.
*   Use "framed" screenshots (the UI inside a phone frame) for a premium look.

### 4. Tablet Screenshots (7" and 10") - **HIGHLY RECOMMENDED**
*   Even if you don't have a tablet, you can use an emulator to take these.
*   Google boosts your ranking if you provide these, as it proves the app is "responsive."

### 5. Preview Video - **OPTIONAL**
*   Must be a YouTube URL.
*   Keep it short (15-30s). Show the smooth haptics and animations.

---

**Tip**: Since your app is built with NativeWind, you can easily capture tablet screenshots by running the app in an Android Tablet Emulator. The layout will automatically scale to fill the space beautifully.

