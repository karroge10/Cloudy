# 🛡️ Security Audit & Hardening Plan

This document tracks identified security gaps, architectural vulnerabilities, and the path toward a "Privacy-First" infrastructure for **Cloudy**.

## 🔍 Technical Audit Findings

### 1. Plain Text Database Storage (Critical Risk)
*   **The Problem:** Gratitude entries (`text` column in `posts` table) are stored as raw, unencrypted strings in the Supabase Postgres database.
*   **The Reality:** While RLS (Row Level Security) prevents unauthorized *users* from seeing the data, any database administrator or attacker with access to the Supabase dashboard can read every memory plain as day.
*   **The Fix (Field-Level Encryption):** 
    *   Encrypt entries on the client-side *before* sending to Supabase using a library like `crypto-js` or `Web Crypto API`.
    *   The encryption key should stay on the device (e.g., derived from a user's master key or stored in `SecureStore`).

### 2. Session Persistence in Plaintext (Medium Risk)
*   **The Problem:** The Supabase client in `src/lib/supabase.ts` is configured to use `AsyncStorage` for session persistence.
*   **The Impact:** On many Android devices, `AsyncStorage` is stored in a plain text XML file on the filesystem. A malicious app with root access or a backup-based physical attack could steal the session JWT.
*   **The Fix:** Update `src/lib/supabase.ts` to use `ExpoSecureStoreAdapter` (which uses hardware-backed encryption on Android/iOS) for the `auth.storage` configuration.

### 3. Lack of End-to-End Encryption (E2EE)
*   **The State:** Cloudy is currently "Secure in Transit" (HTTPS) and "Encrypted at Rest" (Cloud Provider Disk Encryption), but it is **not** E2EE.
*   **The Goal:** Moving to a Zero-Knowledge architecture where not even the Cloudy team can read user journals.

---

## 🏗️ Security Hardening Roadmap

### Phase 1: Storage & Persistence (Immediate)
- [x] **Secure Session Storage:** Swap `AsyncStorage` for `SecureStore` in the Supabase client initialization. (Implemented)
- [x] **Snapshot Protection:** Obscure the app in the App Switcher using a "Privacy Overlay" when the app state is `inactive` or `background`. (Implemented in `App.tsx`)
- [x] **Accessibility Shield:** Unmount sensitive UI (like the journal feed) when the app is locked, preventing Screen Readers (TalkBack/VoiceOver) from reading content "behind" the lock screen. (Implemented in `LockScreen.tsx`)

### Phase 2: Input & UI Security
- [x] **Android BackHandler Guard:** Implement logic to prevent users from using the hardware Back button to bypass the `LockScreen` component. (Implemented)
- [ ] **Zero-Frame Leakage:** Optimize `isBioLocked` initialization in `App.tsx` to ensure the journal content is never rendered for a fraction of a second during a cold start.

### Phase 3: Zero-Knowledge (Advanced)
- [ ] **Field-Level Encryption (FLE):** Implement client-side encryption for the `text` field. 
- [ ] **Metadata Privacy:** Consider hashing or anonymizing metadata like `mascot_name` or `mood` if it could be used for user profiling.

---

## 📋 Security Checklist
- [x] Use `SecureStore` for Auth storage.
- [x] Implement `AppState` listener for privacy blur.
- [ ] Audit all third-party libraries for data leakage.
- [ ] Ensure `deleted_at` records are purged from the database after 30 days.
- [ ] Verify that biometric keys are stored in the device's Secure Enclave.
