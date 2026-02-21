# Cloudy

A mindful space for your daily memories and gratitude. Built with React Native and Expo.

**Live Website:** [cloudyapp.vercel.app](https://cloudyapp.vercel.app)

## Getting Started

### Prerequisites

* Node.js
* npm or yarn
* Expo CLI (`npm install -g expo-cli`)
* Android Studio (for emulator) or a physical device with USB debugging enabled

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file in the root with:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   EXPO_PUBLIC_POSTHOG_API_KEY=your_key
   EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_id
   ```

## Development

### Running on Android

If you are using a physical device over Wi-Fi, connect it via ADB first:
```bash
adb connect <device_ip>:<port>
```

Start the development build:
```bash
npm run android
```

### Running the Metro Bundler

If the app is already installed on your device:
```bash
npx expo start
```

## Building

This project uses EAS Build for native binaries.

### Preview Build (APK)
```bash
eas build --profile preview --platform android
```

### Production Build (AAB)
```bash
eas build --profile production --platform android
```

## Tech Stack

* Framework: React Native (Expo)
* Styling: NativeWind (Tailwind CSS)
* Database: Supabase
* Analytics: PostHog
* Icons: Expo Vector Icons
* Navigation: React Navigation
