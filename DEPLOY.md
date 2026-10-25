# 26 HRS HACKATHON – NEXUS: Vercel Deployment Guide

This guide outlines the complete setup and deployment procedure for deploying the **26 HRS HACKATHON – NEXUS** web application and backend API to [Vercel](https://vercel.com).

---

## 1. Required Environment Variables

Configure the following environment variables in your Vercel Project Settings under **Settings > Environment Variables**:

| Variable Name | Required | Minimum Requirement / Format | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- |
| `MONGODB_URI` | **Yes** | Standard MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/26hrs-hackathon?retryWrites=true&w=majority` | Connection string to your MongoDB Atlas cluster. |
| `ADMIN_PASSWORD` | **Yes** | Strong secret string (**min. 8 characters**) | `nexus_admin_secure_2026!` | Master password for administrator login and sensitive actions. |
| `NODE_ENV` | **Yes** | Value must be `production` | `production` | Enforces production security checks, rate limits, and secure cookies. |

> [!IMPORTANT]
> - `ADMIN_PASSWORD` must be at least **8 characters long**. In `production` mode, the server will block unauthorized admin requests and return an explicit configuration error if this variable is missing or shorter than 8 characters.
> - Never commit your `.env` file to Git.

---

## 2. MongoDB Atlas Network Access Configuration

Because Vercel serverless functions run on dynamically assigned IP ranges across multiple AWS/GCP regions, you must allow external connections from Vercel:

1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. In the left navigation sidebar under **Security**, click **Network Access**.
3. Click the green **+ Add IP Address** button.
4. Select **Allow Access From Anywhere** (which inserts `0.0.0.0/0`).
5. Set an optional comment (e.g., `Vercel Serverless Functions`) and click **Confirm**.
6. Ensure the IP status turns **Active** (green).

---

## 3. Deployment Steps to Vercel

### Step A: Push Code to GitHub
1. Stage all application files (your `.gitignore` already protects `.env`, `test-tools/`, and test artifacts):
   ```bash
   git add .
   git commit -m "Prepare 26hrs hackathon application for Vercel deployment"
   git push origin main
   ```
2. Verify with `git status` that `.env` and `test-tools/` are clean and untracked.

### Step B: Import Project in Vercel
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Select your GitHub repository (`26hrs-hackathon` / `24h`).
4. In the **Configure Project** screen:
   - **Framework Preset**: Select `Other` (or leave default).
   - **Root Directory**: `./` (default repository root).
   - **Build and Output Settings**: Vercel uses the configuration defined in `vercel.json` (`outputDirectory: "public"`, API functions in `/api`).

### Step C: Add Environment Variables
1. Expand the **Environment Variables** section before deploying.
2. Add each of the 3 required variables:
   - `MONGODB_URI`: Your real MongoDB Atlas connection string
   - `ADMIN_PASSWORD`: Your chosen admin password (8+ characters)
   - `NODE_ENV`: `production`
3. Click **Deploy**.

---

## 4. Verification and Live Testing

Once the deployment completes and Vercel assigns your production URL (e.g. `https://nexus-26hrs-hackathon.vercel.app`), verify the live deployment:

1. **Health Check**:
   - Open `https://<your-vercel-domain>/api/health` in your browser.
   - Expected response: HTTP 200 with `status: "healthy"`, `api: "ok"`, `database: "connected"`.

2. **Static & Security Route Check**:
   - `https://<your-vercel-domain>/` -> Returns the black-and-gold NEXUS home page.
   - `https://<your-vercel-domain>/server.js` -> Returns 404 Not Found (server code is never publicly exposed).
   - `https://<your-vercel-domain>/package.json` -> Returns 404 Not Found.

3. **Secure Cookie Check (HTTPS)**:
   - Log into the Admin panel (`/#/login`).
   - Open DevTools > **Application > Cookies**:
     - Cookie `admin_session` must have `HttpOnly: true`, `Secure: true`, `SameSite: Strict`.
   - Refresh the page: the session persists seamlessly via the session-aware `/api/admin/me` backend verification.

4. **Team Registration Flow**:
   - Navigate to `/#/register` and submit a test registration.
   - Confirm the success page displays a valid `24H...` Team ID.
