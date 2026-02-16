# 🛡️ Security Audit & Hardening Plan

This document tracks identified security gaps, architectural vulnerabilities, and the path toward a "Privacy-First" infrastructure for **Cloudy**.

## 🔍 Technical Audit Findings

### 1. Plain Text Database Storage (RESOLVED ✅)
*   **Status:** **Implemented via End-to-End Encryption (E2EE).**
*   **Solution:** All journal entries are now encrypted client-side using **AES-256-CBC** before being sent to Supabase.
*   **Result:** Even with full database access, entries appear as encrypted blobs (`v1:aes:...`). The encryption key is stored exclusively in the device's Secure Enclave/Keystore.

### 2. Session Persistence in Plaintext (RESOLVED ✅)
*   **Status:** **Implemented via SecureStoreAdapter.**
*   **Solution:** Replaced standard `AsyncStorage` with `expo-secure-store` for Supabase auth persistence.
*   **Result:** Session JWTs are encrypted at the OS level, protecting against physical/backup-based attacks.

### 3. Lack of End-to-End Encryption (RESOLVED ✅)
*   **Status:** **Zero-Knowledge Architecture achieved.**
*   **Result:** The Cloudy team has mathematically zero ability to read user journals.

---

## 🏗️ Security Hardening Roadmap

### Phase 1: Storage & Persistence (Complete)
- [x] **Secure Session Storage:** Swap `AsyncStorage` for `SecureStore` in the Supabase client initialization.
- [x] **Snapshot Protection:** Obscure the app in the App Switcher using a "Privacy Overlay" (Mascot Lock).
- [x] **Accessibility Shield:** Unmount sensitive UI when the app is locked.

### Phase 2: Input & UI Security (Complete)
- [x] **Android BackHandler Guard:** Prevent bypassing the LockScreen via hardware buttons.
- [x] **Zero-Frame Leakage:** `RootNavigator` state-machine ensures nothing private renders until auth status is absolute.

### Phase 3: Zero-Knowledge (Complete)
- [x] **Field-Level Encryption (FLE):** Immediate client-side encryption for the `text` field. 
- [x] **Metadata Privacy:** Metadata is disconnected from identifying personal information.

---

## 📋 Security Checklist
- [x] Use `SecureStore` for Auth storage.
- [x] Implement `AppState` listener for privacy blur.
- [x] Field-Level Encryption (FLE) for journal entries.
- [x] Metadata Privacy.
- [x] Audit all third-party libraries for data leakage.
- [x] Ensure `deleted_at` records are handled securely.
- [x] Verify biometric keys are in Secure Enclave.
