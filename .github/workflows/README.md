# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated building and releasing.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Trigger:** Automatically runs on every push or pull request to `main` or `develop` branches.

**Purpose:** Builds the web application to ensure code quality and catch build errors early.

**Actions:**
- Sets up Node.js
- Installs dependencies
- Builds the web application
- Stores build artifacts for 7 days

### 2. Release Workflow (`release.yml`)

**Trigger:** Can be triggered in two ways:
1. **Automatic:** When you push a Git tag starting with `v` (e.g., `v1.0.0`)
2. **Manual:** Using GitHub's "Run workflow" button in the Actions tab

**Purpose:** Creates a GitHub release with downloadable web application and Android APK builds.

**Actions:**
- Builds the web application
- Builds the Android APK using EAS Build
- Creates ZIP archive of the web build
- Creates a GitHub release with:
  - Release notes
  - Downloadable web application ZIP
  - Downloadable Android APK
  - Installation instructions

**Requirements:**
- `EXPO_TOKEN` secret must be configured in repository settings for Android builds
- Get your token from https://expo.dev after creating an account

## How to Create a Release

### Method 1: Using Git Tags (Recommended)

```bash
# Create and push a new tag
git tag v1.0.0
git push origin v1.0.0
```

This will automatically trigger the release workflow and create a GitHub release with version 1.0.0.

### Method 2: Manual Workflow Dispatch

1. Go to the GitHub repository
2. Click on "Actions" tab
3. Select "Release" workflow from the left sidebar
4. Click "Run workflow" button
5. Enter the version number (e.g., 1.0.0)
6. Click "Run workflow"

The workflow will create a release with the specified version number.

## Release Artifacts

Each release includes:

- `whatsapp-audio-web.zip` - Web application build ready to deploy
- `whatsapp-audio.apk` - Android APK ready to install on devices

### Using the Web Application

After downloading the web application ZIP:

```bash
# Extract the archive
unzip whatsapp-audio-web.zip -d whatsapp-audio-web

# Serve with any static file server
cd whatsapp-audio-web
npx serve .

# Or use Python
python3 -m http.server 8000

# Or use PHP
php -S localhost:8000
```

Then open your browser to `http://localhost:8000` (or the appropriate port).

### Using the Android APK

After downloading the Android APK:

1. **Enable Installation from Unknown Sources**:
   - Go to Settings > Security
   - Enable "Install unknown apps" or "Unknown sources"
   - Allow installation from your browser or file manager

2. **Install the APK**:
   - Open the downloaded `whatsapp-audio.apk` file
   - Follow the installation prompts
   - Grant necessary permissions when requested

3. **Configure API Key**:
   - Launch the app
   - Enter your Gemini API key in the app settings
   - Get your key from: https://aistudio.google.com/apikey

## Setup Requirements

### For Repository Maintainers

To enable Android APK builds in the release workflow, you must configure the `EXPO_TOKEN` secret:

1. Create an Expo account at https://expo.dev (free)
2. Generate an access token:
   - Go to https://expo.dev/accounts/[username]/settings/access-tokens
   - Click "Create Token"
   - Give it a descriptive name (e.g., "GitHub Actions")
   - Copy the token
3. Add the token to GitHub repository secrets:
   - Go to repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: Paste your Expo token
   - Click "Add secret"

Without this token, the Android build will fail but the web build will still succeed.

## Environment Variables

The web application requires a Gemini API key to function. Users need to configure it when running the app.

Get your API key from: https://aistudio.google.com/apikey

## Troubleshooting

### Build Failures

If the build fails:
1. Check the Actions log for detailed error messages
2. Try building locally with `npm run build:web`
3. Ensure all dependencies are properly installed

### Release Not Created

If a release isn't created after pushing a tag:
1. Verify the tag name starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
2. Check the Actions tab for workflow status
3. Ensure you have proper permissions in the repository
