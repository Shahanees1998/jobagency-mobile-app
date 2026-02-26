# App assets

## External app icon (APK / home screen icon)

The icon shown on the device when the app is installed comes from these files:

| File | Purpose | Recommended size |
|------|---------|------------------|
| **icon.png** | Main app icon (iOS and fallback) | 1024×1024 px |
| **android-icon-foreground.png** | Android launcher icon (foreground layer) | 1024×1024 px, transparent background |

Both are configured in **app.json**. Android uses the foreground image on top of a solid background color (`#E6F4FE`); you can change that in `expo.android.adaptiveIcon.backgroundColor` in app.json.

**To update the external app logo:**

1. Replace **icon.png** and **android-icon-foreground.png** in this folder with your logo (same or separate files; for Android, a transparent-background version looks best).
2. Rebuild the native project and APK:
   - **Local:** `npx expo prebuild --clean` then build the Android app (e.g. `cd android && ./gradlew assembleRelease`).
   - **EAS:** `eas build --platform android --profile production` (or your profile).

The installed APK will show your new icon only after a fresh build.

---

## Auth assets

- **auth-banner.png** – Dark banner image with optional grid pattern for login/register screens (~top 40–45% of screen). Replace the placeholder with your design asset.
- **logo.png** – White stylized “N” logo shown in the auth banner. Replace the placeholder with your logo.

These are used by `components/auth/AuthBanner.tsx`.
