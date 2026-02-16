# 🔐 Cloudy Authentication & Onboarding Architecture

This document outlines the stabilized authentication, onboarding, and navigation workflows for Cloudy. Refer to this before making changes to `App.tsx`, `AuthScreen.tsx`, or `ProfileContext.tsx`.

---

## 🏗️ State Machine (The `viewMode`)

The app's entry point in `App.tsx` uses a primary state variable `viewMode` to determine which navigation stack to render.

| State | Condition | Screen/Stack Shown |
| :--- | :--- | :--- |
| `loading` | Cold start with session + profile fetching | Full-screen `ActivityIndicator` |
| `auth` | `session === null` | Welcome -> StruggleSelection -> GoalSelection -> Summary -> Auth |
| `onboarding` | Logged in but `profile.onboarding_completed === false` | StruggleSelection -> GoalSelection -> Summary |
| `app` | Logged in and `profile.onboarding_completed === true` | MainTabNavigator (Home, Journey, Profile) |

### 🔩 The Navigator Key (CRITICAL)
The `Stack.Navigator` in `App.tsx` uses `key={viewMode}`.
*   **Why:** When `viewMode` changes (e.g., from `auth` to `app`), the entire navigator is destroyed and recreated fresh.
*   **Effect:** Prevents "sticky" screens where a user might stay on the Login screen even after a session is created.

---

## 🔄 Core Workflows

### 1. New User Flow (Anonymous)
1.  User enters **Welcome Screen**.
2.  Goes through **Struggles** & **Goals**.
3.  On **Summary Screen**, clicks "Start Writing".
4.  `supabase.auth.signInAnonymously()` is called.
5.  Profile is initialized via `updateProfile` with `onboarding_completed: true`.
6.  `App.tsx` detects `session` and `profile`, switches `viewMode` to `app`.

### 2. Guest-to-User Conversion (Securing Account)
This occurs when a guest user clicks "Secure Your Journey" in the Profile or a Home nudge.
1.  User navigates to the screen named `SecureAccount` (which is the `AuthScreen` component).
2.  User signs in via Google or Email.
3.  **Merging:** `JournalContext.tsx` detects a new session and checks for `pending_merge_anonymous_id`.
4.  Database RPC `merge_anonymous_data` is called to transfer entries to the new account.
5.  **Navigation:** `AuthScreen` manually calls `navigation.navigate('MainApp')` because the `viewMode` (already `app`) doesn't trigger a reset.

### 3. Returning User (Login)
1.  Existing user clicks "Log In" on **Welcome Screen**.
2.  Signs in.
3.  `App.tsx` detects the session, fetches the profile, and sees `onboarding_completed === true`.
4.  `viewMode` switches to `app`, landing them on Home.

---

## 🛡️ Navigation Safeguards

### `Auth` vs `SecureAccount`
The same component (`AuthScreen.tsx`) is registered twice in the navigators but with different names:
*   **In `auth` mode:** It is named `Auth`.
*   **In `app` mode:** It is named `SecureAccount`.
*   **Rationale:** This creates a strict boundary. If the app is in `app` mode, trying to navigate to `Auth` will fail or be ignored, preventing the app from getting "stuck" back in the login phase during a stack switch.

### The "No-Flash" Loading Strategy
*   We use `isColdStartWithSession` (a ref) to only show the full-screen loader during the initial app boot.
*   If a user logs in *while the app is running*, we stay on the Auth screen with a local spinner until the profile is 100% ready. This prevents the "white flash" or empty loader between clicks.

---

## 📢 Success Messaging Logic
To avoid double modals, follow this order:
1.  **AuthScreen:** Never show a "Success" alert. Just navigate to `MainApp` or let the state machine handle it.
2.  **JournalContext:** Only show the "Welcome Back / Memories Merged" modal here, inside the merge logic, *after* the data has been refreshed. This ensures the user sees their updated streak/posts behind the modal.

---

## 🚫 Common Pitfalls to Avoid
*   **DO NOT** navigate manually to `MainApp` on a fresh login from the Welcome screen. It will crash because `MainApp` doesn't exist in the `auth` stack. Let `viewMode` handle it.
*   **DO NOT** remove `key={viewMode}` from the navigator.
*   **DO NOT** call `setLoading(false)` in `AuthScreen` before the navigation has occurred, or the button will "flicker" back to its idle state for a split second.
