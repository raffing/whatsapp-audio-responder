# WhatsApp Audio Responder - Mobile App

React Native mobile app powered by Expo for transcribing and analyzing audio messages.

## Development

### Prerequisites
- Node.js
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

### Setup

1. Install dependencies from monorepo root:
```bash
npm install
```

2. Create `.env.local` file in the monorepo root with your API key:
```
GEMINI_API_KEY=your_api_key_here
```

3. Start the Expo development server:
```bash
npm run dev:mobile
```

4. Scan the QR code with Expo Go app (Android) or Camera app (iOS)

## Building Android APK

### Local Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Build APK locally:
```bash
cd apps/mobile
eas build --platform android --profile preview --local
```

The APK will be generated in the current directory.

### Production Build

For production builds with automatic signing:

```bash
cd apps/mobile
eas build --platform android --profile production
```

## Features

- Audio file selection from device storage
- Multiple audio type support (WhatsApp, Notes, Calls, Meetings)
- Real-time transcription using Gemini AI
- Clean, native mobile UI

## Environment Variables

The app reads the `GEMINI_API_KEY` from the `.env.local` file in the monorepo root.
Make sure to set this before running the app.
