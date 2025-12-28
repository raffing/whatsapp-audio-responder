# Instructions to Rerun v1.0.0 Workflow

## Changes Made
- Updated Expo project ID in `apps/mobile/app.json` to `d24a592c-9693-47fa-8846-4b183a79fc3b`
- Updated Expo project ID in `apps/mobile/app.config.js` to `d24a592c-9693-47fa-8846-4b183a79fc3b`

## To Rerun the Workflow

### Option 1: Manual Workflow Dispatch (Recommended)
1. Go to the GitHub repository: https://github.com/raffing/whatsapp-audio-responder
2. Click on the "Actions" tab
3. Select "Release" workflow from the left sidebar
4. Click "Run workflow" button (green button on the right)
5. Enter version number: `1.0.0`
6. Click "Run workflow"

This will trigger the release workflow with the corrected Expo project ID.

### Option 2: Update and Push the v1.0.0 Tag
If you have push access and want to update the tag:

```bash
# Delete the remote tag (requires force push permission)
git push origin :refs/tags/v1.0.0

# Delete local tag
git tag -d v1.0.0

# Create new tag from the branch with the fix
git checkout copilot/set-project-expo-id
git tag v1.0.0

# Push the new tag
git push origin v1.0.0
```

This will automatically trigger the release workflow.

### Option 3: Create a New Version Tag
Create a new version (e.g., v1.0.1) with the fix:

```bash
git checkout copilot/set-project-expo-id
git tag v1.0.1
git push origin v1.0.1
```

This will trigger the release workflow for version 1.0.1 with the corrected Expo project ID.

## Expected Result
Once the workflow is triggered with the corrected Expo project ID, the Android APK build should complete successfully, and the release will include both the web application and Android APK.
