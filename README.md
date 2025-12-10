# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18JlSBdsfUj_mCG8zAVZQY8x7sFv3Ot2T

## Features

- AI-powered note transcription and summarization using Google Gemini
- Support for image and audio notes
- Rich text editor for user notes
- **Google Drive integration** - Save notes to your Google Drive
- PDF and Markdown export
- Dark mode support

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in [.env.local](.env.local):
   - `VITE_GEMINI_API_KEY` - Your Gemini API key (required)
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (required for Google Drive integration)

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Google Cloud

Use the provided `Dockerfile` and `cloudbuild.yaml` to build and deploy the static Vite bundle to Cloud Run with Cloud Build.

1. **Populate `.env.cloudbuild`:** copy your production values into [.env.cloudbuild](.env.cloudbuild). This file is included in the Docker build context and read when Vite runs with `--mode cloudbuild`.
2. **Enable required services** in your Google Cloud project (only needed once):
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
   ```
3. **Build the container locally (optional)**
   ```bash
   docker build -t menthe-web .
   docker run -p 8080:8080 menthe-web
   ```
4. **Submit a Cloud Build** (replaces the failing build that complained about the missing Dockerfile):
   ```bash
   gcloud builds submit \
     --config cloudbuild.yaml \
     --substitutions=_SERVICE_NAME=menthe-web,_REGION=us-central1,_IMAGE=gcr.io/$PROJECT_ID/menthe-web:$COMMIT_SHA
   ```
   - `_SERVICE_NAME`: Cloud Run service name.
   - `_REGION`: Cloud Run region (e.g., `us-central1`).
   - `_IMAGE`: Artifact Registry/Container Registry image URI.

Cloud Build will:
- Build the production bundle with `npm ci && npm run build`.
- Package it into an Nginx container that serves all client-side routes (SPA fallback handled in `deployment/nginx.conf`).
- Push the image and deploy it to Cloud Run with unauthenticated access enabled.

## Google Drive Integration Setup

To enable the "Save to Drive" feature, you need to set up Google OAuth:

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Drive API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Add your production domain if deploying
   - Add authorized redirect URIs:
     - `http://localhost:3000`
     - Add your production domain if deploying
   - Click "Create"

4. **Copy the Client ID:**
   - Copy the generated Client ID
   - Add it to your `.env.local` file:
     ```
     VITE_GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
     ```

5. **Restart the development server:**
   ```bash
   npm run dev
   ```

### How it Works

- First-time save: Creates a new text file in the user's Google Drive
- Subsequent saves: Updates the existing file (no duplicates)
- After successful save: A notification appears with a "View in Drive" link
- The note stores the Drive file ID for future updates
