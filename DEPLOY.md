# Ourshelves Deployment Guide

## Free Deployment on Render.com

### Prerequisites
- GitHub repository: https://github.com/DEDSEC-0010/OurShelves
- Render.com account (free)

---

## Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

---

## Step 2: Deploy Backend (Web Service)

1. Click **New +** → **Web Service**
2. Connect your `OurShelves` repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `ourshelves-api` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random 32+ char string)
   - `PORT` = `3000`

5. Click **Create Web Service**

---

## Step 3: Deploy Frontend (Static Site)

1. Click **New +** → **Static Site**
2. Connect the same repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `ourshelves` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Add Environment Variable:
   - `VITE_API_URL` = `https://ourshelves-api.onrender.com`

5. Click **Create Static Site**

---

## Step 4: Update Frontend API URL

Update `client/src/services/api.js` to use the deployed backend URL:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

---

## Alternative: Single Service Deployment

Deploy both frontend and backend as one service:

1. Build frontend: `cd client && npm run build`
2. Server serves static files from `client/dist`
3. Deploy only the server with `NODE_ENV=production`

---

## Important Notes

⚠️ **SQLite Limitation**: Render's free tier has ephemeral storage.
The database resets on each deploy. For persistence:
- Upgrade to Render's paid tier with persistent disk
- Or migrate to PostgreSQL (Render offers free PostgreSQL)

---

## Useful URLs

- **Render Dashboard**: https://dashboard.render.com
- **Your App**: `https://ourshelves.onrender.com`
- **Your API**: `https://ourshelves-api.onrender.com`
