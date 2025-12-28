# WhatsApp Audio Responder - Monorepo

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

TypeScript monorepo for transcribing and analyzing audio messages using Google Gemini AI. Includes both web and mobile applications sharing the same business logic.

## 🏗️ Architecture

This project is structured as a monorepo with the following packages:

```
/
├── apps/
│   ├── web/          # React web application (Vite)
│   └── mobile/       # React Native mobile app (Expo)
└── packages/
    └── core/         # Shared business logic (platform-agnostic)
```

### Design Decisions

1. **Monorepo with npm workspaces**: Simplifies dependency management and code sharing
2. **Platform-agnostic core**: All business logic (AI, API calls, types) lives in `packages/core` with zero UI dependencies
3. **Separate UI layers**: Web and mobile apps consume the core package but implement their own UI
4. **TypeScript everywhere**: Strong typing across all packages
5. **Environment variables**: 
   - Web: Uses Vite's `.env.local` file
   - Mobile: Uses Expo Constants with runtime API key injection

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- For mobile development: Expo Go app on your phone

### Installation

1. Clone the repository:
```bash
git clone https://github.com/raffing/whatsapp-audio-responder.git
cd whatsapp-audio-responder
```

2. Install dependencies (this installs all packages in the monorepo):
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your Gemini API key to `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

## 📱 Web Application

### Development

Start the web development server:
```bash
npm run dev:web
```

The app will be available at `http://localhost:3000`

### Build

Build the web app for production:
```bash
npm run build:web
```

Built files will be in `apps/web/dist/`

### Features

- Audio file upload
- Multiple audio type support (WhatsApp, Personal Notes, Call Recordings, Meetings)
- Real-time transcription
- AI-powered reply generation (for WhatsApp messages)
- Text-to-speech with voice customization
- Summary and key points extraction
- Meeting recaps with action items

## 📲 Mobile Application

### Development

Start the Expo development server:
```bash
npm run dev:mobile
```

Then:
1. Install **Expo Go** app on your phone (iOS or Android)
2. Scan the QR code shown in the terminal
3. The app will load on your device

### Building Android APK

#### Prerequisites for Building

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Create an Expo account at https://expo.dev (free)

3. Login to EAS:
```bash
eas login
```

#### Build APK

There are two ways to build:

**Option 1: Local Build (Faster, requires Android SDK)**
```bash
cd apps/mobile
eas build --platform android --profile preview --local
```

**Option 2: Cloud Build (Recommended, no local setup needed)**
```bash
cd apps/mobile
eas build --platform android --profile preview
```

The APK will be available for download after the build completes. You can install it directly on your Android device.

### Mobile Features

- Audio file selection from device storage
- Multiple audio type support
- Real-time transcription using Gemini AI
- Clean, native mobile UI
- Offline-capable (transcription requires internet)

## 🏗️ Project Structure

### Core Package (`packages/core`)

Platform-agnostic business logic:

- **Types** (`types/`): All TypeScript interfaces and enums
- **Services** (`services/`):
  - `geminiService.ts`: All Gemini AI API interactions (transcription, generation, TTS)
- **Utils** (`utils/`):
  - `audioUtils.ts`: Base64 encoding/decoding
  - `textUtils.ts`: Platform-agnostic text processing

### Web App (`apps/web`)

React web application:

- **Components** (`src/components/`): All React UI components
- **Services** (`src/services/`): Web-specific services (localStorage, etc.)
- **Utils** (`src/utils/`): Web-specific utilities (DOM-based HTML rendering, Web Audio API)

### Mobile App (`apps/mobile`)

React Native + Expo application:

- Simplified UI focused on core transcription functionality
- Uses native file picker
- Configured for Android APK builds

## 🔧 Development Scripts

From the root directory:

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start web development server |
| `npm run build:web` | Build web app for production |
| `npm run dev:mobile` | Start Expo development server |
| `npm run build:mobile` | Build Android APK (requires EAS CLI) |

## 🧪 Testing

Currently, there is no test infrastructure. This is intentional to keep the initial refactoring minimal and focused.

## 📝 Environment Variables

Both apps require a `GEMINI_API_KEY`:

- **Web**: Set in `.env.local` in the root directory
- **Mobile**: Same `.env.local` file, read at build time via `app.config.js`

## 🔒 Security Notes

- Never commit `.env.local` or any file containing API keys
- The `.gitignore` is configured to exclude all `.env*.local` files
- For production deployments, use secure environment variable management

## 🏛️ Architecture Decisions

### Why Monorepo?

1. **Code Sharing**: Business logic is written once and used by both web and mobile
2. **Type Safety**: Shared TypeScript types ensure consistency
3. **Simplified Dependencies**: One `package.json` for shared dependencies
4. **Easier Refactoring**: Changes to core logic automatically propagate

### Why Platform-Agnostic Core?

1. **Portability**: Core package has zero platform-specific dependencies
2. **Testing**: Business logic can be tested independently of UI
3. **Future-Proof**: Easy to add new platforms (desktop, CLI, etc.)

### Why Expo for Mobile?

1. **Fast Development**: Hot reload, built-in components
2. **Easy Building**: EAS Build handles Android/iOS builds
3. **No Native Code Required**: Pure JavaScript/TypeScript
4. **Quick Iterations**: Test on real devices via Expo Go

## 📊 Technical Debt & Limitations

### Current Limitations

1. **No Tests**: Test infrastructure was not added to keep changes minimal
2. **Basic Mobile UI**: Mobile app implements only core transcription flow, not all features from web
3. **No iOS Build Instructions**: Requires macOS for local builds (cloud build works)
4. **API Key in Config**: Mobile app reads API key from config file (not ideal for production)

### Future Improvements

1. Add comprehensive test suite (Jest, React Testing Library)
2. Implement full feature parity in mobile app
3. Add CI/CD pipelines
4. Implement secure API key storage for mobile (Expo SecureStore)
5. Add error boundaries and better error handling
6. Implement offline support and caching
7. Add internationalization (i18n)

## 🤝 Contributing

This is a monorepo project. When making changes:

1. **Core Logic**: Changes go in `packages/core` (must be platform-agnostic)
2. **Web UI**: Changes go in `apps/web`
3. **Mobile UI**: Changes go in `apps/mobile`
4. **Always test both platforms** after core changes

## 📄 License

See original repository for license information.

## 🙏 Acknowledgments

- Powered by Google Gemini API
- Built with React, React Native, and Expo
- UI design inspired by modern mobile-first applications

---

**Note**: This project was refactored from a single React app to a monorepo structure to support both web and mobile platforms while maintaining code quality and reducing duplication.
