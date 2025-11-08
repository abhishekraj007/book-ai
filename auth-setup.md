# Authentication Setup Guide

This guide will help you configure Google OAuth and Apple Sign-In for both web and mobile applications in this project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Google OAuth Setup](#google-oauth-setup)
- [Apple Sign-In Setup](#apple-sign-in-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Testing Authentication](#testing-authentication)

---

## Prerequisites

Before setting up authentication, ensure you have:

- A Google Cloud Platform account
- An Apple Developer account (for iOS apps)
- Access to your project's backend environment variables

---

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select **"New Project"**
3. Enter a project name (e.g., "Book AI") and click **"Create"**
4. Wait for the project to be created, then select it

### 2. Enable Google+ API

1. In the Google Cloud Console, navigate to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and press **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** user type (or "Internal" if using Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Your app name (e.g., "Book AI")
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On the **Scopes** page, click **"Add or Remove Scopes"**
7. Add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click **"Save and Continue"**
9. Add test users if needed (for testing in development mode)
10. Click **"Save and Continue"** and then **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

#### For Web Application:

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., "Book AI Web")
5. Under **"Authorized JavaScript origins"**, add:
   - `http://localhost:3006` (for local development)
   - Your production web URL (e.g., `https://yourdomain.com`)
   - Your Convex site URL (e.g., `https://your-project.convex.site`)
6. Under **"Authorized redirect URIs"**, add:
   - `http://localhost:3006/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://your-project.convex.site/api/auth/callback/google`
7. Click **"Create"**
8. Save the **Client ID** and **Client Secret** - you'll need these for environment variables

#### For Mobile Application (iOS/Android):

1. Click **"Create Credentials"** > **"OAuth client ID"** again
2. Select **"iOS"** for iOS app
   - Enter your iOS Bundle ID (found in `app.json` under `expo.ios.bundleIdentifier`)
   - Enter your App Store ID (if available)
3. Click **"Create"**
4. For Android:
   - Select **"Android"** as application type
   - Enter your Android package name (found in `app.json` under `expo.android.package`)
   - Get your SHA-1 certificate fingerprint:

     ```bash
     # For debug keystore
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

     # For release keystore (if you have one)
     keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
     ```

   - Enter the SHA-1 fingerprint

5. Click **"Create"**

#### For Expo Go (Development):

1. Create another OAuth client ID
2. Select **"iOS"** and use Bundle ID: `host.exp.Exponent`
3. Create another for **"Android"** with package name: `host.exp.exponent`
4. Use the debug keystore SHA-1 for Android

### 5. Download OAuth Configuration (iOS Only)

1. For iOS, you may need to download the `GoogleService-Info.plist` file
2. In Google Cloud Console, go to your iOS OAuth client
3. Download the configuration file if needed for native Google Sign-In

---

## Apple Sign-In Setup

### 1. Configure App ID in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **"Certificates, Identifiers & Profiles"**
3. Click on **"Identifiers"**
4. Select your App ID or create a new one:
   - Click **"+"** to create new
   - Select **"App IDs"** and click **"Continue"**
   - Select **"App"** and click **"Continue"**
   - Enter **Description** and **Bundle ID** (must match your `app.json`)
5. Under **"Capabilities"**, check **"Sign in with Apple"**
6. Click **"Continue"** and then **"Register"**

### 2. Configure Service ID (for Web)

1. In **"Identifiers"**, click **"+"** to create a new identifier
2. Select **"Services IDs"** and click **"Continue"**
3. Enter:
   - **Description**: Your service name (e.g., "Book AI Web Auth")
   - **Identifier**: A unique identifier (e.g., `com.yourcompany.bookaiservice`)
4. Click **"Continue"** and **"Register"**
5. Select the Service ID you just created
6. Check **"Sign in with Apple"** and click **"Configure"**
7. In the configuration:
   - **Primary App ID**: Select your App ID
   - **Domains and Subdomains**: Add your domain (e.g., `yourdomain.com`)
   - **Return URLs**: Add:
     - `https://yourdomain.com/api/auth/callback/apple`
     - `https://your-project.convex.site/api/auth/callback/apple`
8. Click **"Save"**, then **"Continue"**, then **"Save"** again

### 3. Create a Private Key (for Server-Side Apple Sign-In)

1. In Apple Developer Portal, go to **"Keys"**
2. Click **"+"** to create a new key
3. Enter a **Key Name** (e.g., "Apple Sign-In Key")
4. Check **"Sign in with Apple"**
5. Click **"Configure"** and select your **Primary App ID**
6. Click **"Save"**, then **"Continue"**, then **"Register"**
7. Download the `.p8` private key file - **You can only download this once!**
8. Note down:
   - **Key ID** (displayed after creation)
   - **Team ID** (found in top right of developer portal)

### 4. Configure Expo for Apple Sign-In

1. In your `app.json`, ensure you have:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.bookai",
      "usesAppleSignIn": true
    }
  }
}
```

2. Install the required package (if not already installed):

```bash
npx expo install expo-apple-authentication
```

### 5. Apple Sign-In for Native Apps

For native apps using Expo, Apple Sign-In works differently:

- iOS: Uses native Apple Authentication API (no additional config needed beyond App ID)
- The credentials (identity token) are handled client-side
- The backend validates the token using Better Auth

**Note**: Apple Sign-In on iOS requires:

- A physical iOS device or simulator running iOS 13+
- Cannot be fully tested in Expo Go (requires development build)

---

## Environment Variables Configuration

### Backend Environment Variables (Convex)

Create or update `packages/backend/.env` with:

```env
# Site URLs
SITE_URL=http://localhost:3006
NATIVE_APP_URL=bookai://

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Sign-In (if using server-side validation)
APPLE_CLIENT_ID=com.yourcompany.bookaiservice
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----
```

### Web App Environment Variables

Create or update `apps/web/.env.local` with:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment-name
```

### Native App Environment Variables

Create or update `apps/native/.env` with:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-project.convex.site
```

---

## Testing Authentication

### Testing Google Sign-In

#### Web:

1. Start your web development server:
   ```bash
   cd apps/web
   npm run dev
   ```
2. Navigate to the login page
3. Click "Sign in with Google"
4. Select a Google account
5. Verify successful authentication

#### Mobile:

1. Start Expo development server:
   ```bash
   cd apps/native
   npm start
   ```
2. Open app on device/simulator
3. Tap "Sign in with Google"
4. Complete Google sign-in flow
5. Verify successful authentication

### Testing Apple Sign-In

#### iOS:

1. Build a development client (Apple Sign-In doesn't work in Expo Go):
   ```bash
   cd apps/native
   eas build --profile development --platform ios
   ```
2. Install the development build on your iOS device
3. Run the development server:
   ```bash
   npm start
   ```
4. Open app on device
5. Tap "Sign in with Apple"
6. Complete Apple authentication
7. Verify successful authentication

**Note**: Apple Sign-In requires:

- iOS 13+ device or simulator
- Valid Apple ID
- Development build (not Expo Go)

### Common Issues and Troubleshooting

#### Google OAuth Issues:

1. **"redirect_uri_mismatch" error**
   - Ensure all redirect URIs are added in Google Cloud Console
   - Check that the redirect URI matches exactly (including http/https)

2. **"Access blocked: Authorization Error"**
   - Verify OAuth consent screen is properly configured
   - Add test users in OAuth consent screen for testing

3. **Invalid client error**
   - Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Ensure you're using the correct OAuth client for your platform

#### Apple Sign-In Issues:

1. **"Invalid client" or similar errors**
   - Verify Service ID configuration
   - Check that domains and return URLs are correctly configured
   - Ensure Bundle ID matches your app configuration

2. **Not working in development**
   - Apple Sign-In requires a development build for testing
   - Cannot be tested in Expo Go
   - Use EAS Build to create development build

3. **Private key errors**
   - Ensure `.p8` file content is properly formatted in environment variable
   - Check that Key ID and Team ID are correct

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `SITE_URL` to production domain
- [ ] Add production URLs to Google OAuth redirect URIs
- [ ] Add production URLs to Apple Sign-In return URLs
- [ ] Update OAuth consent screen with production information
- [ ] Remove test mode from Google OAuth (if applicable)
- [ ] Test authentication flows on production environment
- [ ] Verify SSL certificates are valid
- [ ] Update `trustedOrigins` in `createAuth.ts` with production URLs
- [ ] Set `baseURL` in `createAuth.ts` to production URL

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Convex Authentication](https://docs.convex.dev/auth)

---

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure OAuth credentials are for the correct platform
4. Review the Better Auth and platform-specific documentation

