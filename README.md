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

### Prerequisites

Ensure you have the Google Cloud SDK installed. If not, [install gcloud CLI](https://cloud.google.com/sdk/docs/install).

### Deployment Steps

1. **Set your Google Cloud project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required services** in your Google Cloud project (only needed once):
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
   ```

3. **Populate `.env.cloudbuild`:** Copy your production values into [.env.cloudbuild](.env.cloudbuild). This file is included in the Docker build context and read when Vite runs with `--mode cloudbuild`.
   - `VITE_GEMINI_API_KEY` - Your Gemini API key
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (update authorized origins/redirect URIs to your Cloud Run domain)

4. **(Optional) Build and test the container locally:**
   ```bash
   docker build -t menthe-web .
   docker run -p 8080:8080 menthe-web
   ```
   Visit `http://localhost:8080` to verify the build works.

5. **Submit a Cloud Build:**
   ```bash
   gcloud builds submit \
     --config cloudbuild.yaml \
     --substitutions=_SERVICE_NAME=menthe-web,_REGION=us-central1,_IMAGE=gcr.io/$PROJECT_ID/menthe-web:$COMMIT_SHA
   ```
   - `_SERVICE_NAME`: Cloud Run service name (e.g., `menthe-web`)
   - `_REGION`: Cloud Run region (e.g., `us-central1`, `us-east1`)
   - `_IMAGE`: Container Registry image URI (use your project ID)

   If you want to use shorter tags, you can also use:
   ```bash
   gcloud builds submit \
     --config cloudbuild.yaml \
     --substitutions=_SERVICE_NAME=menthe-web,_REGION=us-central1,_IMAGE=gcr.io/$PROJECT_ID/menthe-web:latest
   ```

6. **Monitor the build:**
   ```bash
   gcloud builds log --stream
   ```

7. **View your deployed service:**
   Once the build completes, your app will be deployed to Cloud Run. Find the service URL:
   ```bash
   gcloud run services describe menthe-web --region=us-central1 --format='value(status.url)'
   ```

### What Cloud Build Does

- Builds the production bundle with `npm ci && npm run build`
- Packages it into an Nginx container that serves all client-side routes (SPA fallback handled in `deployment/nginx.conf`)
- Pushes the image to Container Registry
- Deploys it to Cloud Run with unauthenticated access enabled

### Updating Your OAuth Configuration

After deployment, update your Google OAuth credentials to include the Cloud Run domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Add your Cloud Run domain to authorized JavaScript origins and redirect URIs:
   - `https://<your-cloud-run-domain>`
5. Click "Save"

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
