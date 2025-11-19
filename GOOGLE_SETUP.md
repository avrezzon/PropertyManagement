# Google Cloud Project Setup Guide

This guide will walk you through creating a Google Cloud Project and obtaining the necessary Client ID for Google Login and Drive integration.

## Step 1: Create a Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Sign in with your Google account.
3.  In the top navigation bar, click the project dropdown (it might say "Select a project" or show an existing project name).
4.  Click **New Project** in the top right of the modal.
5.  Enter a **Project name** (e.g., "Rental Forecaster").
6.  Click **Create**. Wait a moment for the notification saying the project has been created, then click **Select Project**.

## Step 2: Enable Google Drive API
1.  In the left sidebar, go to **APIs & Services** > **Library**.
2.  In the search bar, type "Google Drive API".
3.  Click on **Google Drive API** in the results.
4.  Click **Enable**.

## Step 3: Configure OAuth Consent Screen
1.  In the left sidebar, go to **APIs & Services** > **OAuth consent screen**.
2.  Select **External** as the User Type (unless you have a Google Workspace organization, then you can choose Internal).
3.  Click **Create**.
4.  **App Information**:
    *   **App name**: "Rental Forecaster" (or your preferred name).
    *   **User support email**: Select your email.
    *   **Developer contact information**: Enter your email.
5.  Click **Save and Continue**.
6.  **Scopes**:
    *   Click **Add or Remove Scopes**.
    *   In the filter, type `drive.file`.
    *   Select the checkbox for `.../auth/drive.file` (See, edit, create, and delete only the specific Google Drive files you use with this app).
    *   Click **Update**.
    *   Click **Save and Continue**.
7.  **Test Users**:
    *   Since the app is in "Testing" mode, you must add your own email address here to be able to log in.
    *   Click **Add Users**.
    *   Enter your Google email address.
    *   Click **Add**, then **Save and Continue**.

## Step 4: Create Credentials (Client ID)
1.  In the left sidebar, go to **APIs & Services** > **Credentials**.
2.  Click **+ Create Credentials** at the top and select **OAuth client ID**.
3.  **Application type**: Select **Web application**.
4.  **Name**: "Rental Forecaster Web Client".
5.  **Authorized JavaScript origins**:
    *   Click **Add URI**.
    *   Enter: `http://localhost:5173`
    *   Click **Add URI**.
    *   Enter: `https://avrezzon.github.io`
6.  **Authorized redirect URIs**:
    *   Click **Add URI**.
    *   Enter: `http://localhost:5173`
    *   Click **Add URI**.
    *   Enter: `https://avrezzon.github.io`
7.  Click **Create**.

## Step 5: Configure Your App
1.  A modal will appear with your "Your Client ID" and "Your Client Secret".
2.  Copy the **Client ID** (it looks like `123456789-abcdefg.apps.googleusercontent.com`).
3.  In your project folder (`d:\PropertyManagement`), create a file named `.env` (if it doesn't exist).
4.  Add the following line to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-copied-client-id-here
```

5.  Restart your development server (`npm run dev`) if it was running.

> [!NOTE]
> If you deploy your app to a live URL (e.g., Vercel, Netlify, GitHub Pages), you must return to Step 4 and add that live URL to both "Authorized JavaScript origins" and "Authorized redirect URIs".
> *   **Origin**: `https://avrezzon.github.io`
> *   **Redirect URI**: `https://avrezzon.github.io/PropertyManagement/`

## Step 6: Configure GitHub Pages Deployment
To allow your deployed site to log in, you must provide the Client ID to GitHub Actions.

1.  Go to your GitHub repository.
2.  Click **Settings** (top tab).
3.  In the left sidebar, verify you are in the "Security" section, then click **Secrets and variables** > **Actions**.
4.  Click **New repository secret**.
5.  **Name**: `VITE_GOOGLE_CLIENT_ID`
6.  **Secret**: Paste your Client ID (from Step 5).
7.  Click **Add secret**.

Now, when you push to `main`, the deployment workflow will automatically inject this ID into your application.

## Troubleshooting

### "Google hasn't verified this app" Warning
When logging in, you might see a scary-looking screen saying "Google hasn't verified this app". This is normal because your app is in **Testing** mode and hasn't been submitted for Google's verification process (which is not needed for personal use).

**To proceed:**
1.  Click the **Advanced** link on that screen.
2.  Click **Go to Rental Forecaster (unsafe)** (or whatever you named your app) at the bottom.
3.  Grant the requested permissions.

**Note**: Only email addresses listed in the **Test Users** section of your OAuth Consent Screen can log in. Ensure you've added yourself there.
