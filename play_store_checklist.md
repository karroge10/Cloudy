# Play Store Publishing Checklist - Cloudy

This checklist outlines the necessary steps to prepare and publish **Cloudy** on the Google Play Store.

## 1. App Configuration & Branding
- [ ] **Package Name:** Ensure `app.cloudy.journal` is final (configured in `app.json`).
- [ ] **Version Management:** 
    - [ ] `version` (e.g., `1.0.0`)
    - [ ] `versionCode` (must increment for every new release).
- [ ] **Icons:** 
    - [ ] Adaptive Icon (foreground & background 108x108 dp safe zone).
    - [ ] Legacy Icon.
- [ ] **Splash Screen:** Verify scaling and background color (`#FFF9F0`).

## 2. Technical Requirements
- [ ] **Build Type:** Generate a signed **Android App Bundle (.aab)** using `eas build --platform android --profile production`.
- [ ] **API Keys:** 
    - [ ] Ensure Google Sign-In is configured with the **Production SHA-1** fingerprint (from Google Play Console).
    - [ ] Supabase production URL and Anon Key are correct.
- [ ] **Permissions:** Review `AndroidManifest.xml` (via Expo config) to ensure no unnecessary permissions are requested.
- [ ] **Hermes:** Verify Hermes engine is enabled for optimized JS execution (Default in Expo 54).

## 3. Store Listing Assets
- [ ] **App Title:** Up to 50 characters.
- [ ] **Short Description:** Up to 80 characters.
- [ ] **Full Description:** Detailed app features and "why".
- [ ] **Screenshots:** 
    - [ ] At least 2-8 screenshots for Phone.
    - [ ] 7-inch & 10-inch Tablet screenshots (if supported).
- [ ] **Feature Graphic:** 1024 x 500 px (no transparency).
- [ ] **App Category:** Set to "Health & Fitness" or "Lifestyle".

## 4. Legal & Privacy
- [ ] **Privacy Policy:** Must have a URL hosting the privacy policy.
- [ ] **Data Safety Form:** Disclose data collection (email for Auth, encrypted journal entries, etc.).
- [ ] **Content Rating:** Complete the questionnaire in Play Console.

## 5. Testing & Quality Assurance
- [ ] **Internal Testing:** Deploy to a small group of testers via Play Console.
- [ ] **Physical Device Testing:** Test on multiple Android versions (API 24 to 34).
- [ ] **Crash Reporting:** Ensure PostHog or Sentry is tracking production errors.
- [ ] **Performance Check:** Verify navigation and large list scrolling (FlashList performance).

## 6. Submission
- [ ] **Release Notes:** Write what's new in this version.
- [ ] **Submit for Review:** Google review typically takes 1-7 days for new apps.
