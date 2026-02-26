# Fix FCM SenderId mismatch (app stays managed by Expo)

## How to check which Firebase project Expo/EAS uses

### Option 1 – EAS CLI (recommended)

1. In the **jobPortalApp** folder, run:
   ```bash
   eas credentials
   ```
2. Choose **Android**.
3. Look for **Push Notifications** / **FCM** (or **Manage your FCM Api Key**).
4. It will show what’s configured:
   - If you **never set** custom FCM credentials, it may say “Use default” or show Expo’s default project (often a different project than yours → **mismatch**).
   - If you **did set** a Google Service Account Key, it may show the key name or that FCM v1 is configured (that key belongs to one Firebase project – the one EAS uses).

The **Firebase project** is the one that owns the **service account key** you uploaded (or Expo’s default). Your admin backend must use credentials from that **same** project.

### Option 2 – Expo dashboard

1. Go to [expo.dev](https://expo.dev) and sign in.
2. Open your **jobPortalApp** project (projectId: `0b155cee-0ed9-4a61-96a4-d6290974460d`).
3. Go to **Credentials** (or **Project settings** → **Credentials**).
4. Select **Android** and your app (package `com.shah11.jobPortalApp`).
5. In **FCM** / **Push notifications** / **Service Credentials** you’ll see:
   - Whether a **FCM v1 service account key** is set (and which account/key name, if shown).
   - That key belongs to a specific Firebase project; that’s the project EAS uses for FCM.

To see the **project ID** of that key: use the same key (or the JSON you uploaded) and check the `project_id` field, or open [Firebase Console](https://console.firebase.google.com) and see which project has that service account (e.g. `firebase-adminsdk-...@PROJECT_ID.iam.gserviceaccount.com`).

---

## Fixing the mismatch

- **If EAS uses a different project** (e.g. Expo default):  
  In Expo (dashboard or `eas credentials`), **set FCM to your project** “the-builders-mobile-app” (upload the service account key from Firebase Console for that project). Then **rebuild** the app (`eas build --platform android`). After that, tokens will be from “the-builders-mobile-app” and your admin `.env` (same project) will work.

- **If EAS already uses “the-builders-mobile-app”**:  
  Then the backend must use that project’s credentials in **jobPortalAdmin/.env** (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY from that project).

Expo’s FCM docs: [Add Google Service Account Keys using FCM V1](https://docs.expo.dev/push-notifications/fcm-credentials/).
