# ChapterForge Deployment Guide

## Production Deployment on Docker

This guide walks you through deploying ChapterForge to a Docker server (like enterprise.local).

---

## Prerequisites

- **Local Machine**: Git, Node.js 16+, SSH client
- **Server**: Docker + Docker Compose, nginx proxy manager (or reverse proxy)
- **Domain**: DNS configured (e.g., `chapterforge.eaa22.org`)
- **Firebase**: Project created, authorized domains configured

---

## Step 1: Prepare Local Repository

### Initialize Git (if not already done)
```powershell
cd "c:\Users\jmanr\seadrive_root\Josh\My Libraries\My Library\Code Projects\New - ChapterForge"
git init
git add .
git commit -m "Initial commit: ChapterForge production build"
git remote add origin https://github.com/1C8Flyers/chapterforge-vue.git
git branch -M main
git push -u origin main
```

### Verify Files
Ensure your local repo has:
- `.env.example` (template, should NOT have secrets)
- `.gitignore` (protects `.env`, `*.db`, Firebase credentials)
- `Dockerfile` and `docker-compose.yml`
- All source files committed

---

## Step 2: Set Up Server

### SSH into Your Server
```bash
ssh nas@enterprise.local
cd /path/to/docker/apps  # Adjust to your docker directory
```

### Clone Repository
```bash
git clone https://github.com/1C8Flyers/chapterforge-vue.git
cd chapterforge-vue
```

### Create Production `.env` File
```bash
nano .env
```

**Paste your production configuration:**
```dotenv
# Server Configuration
PORT=3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@eaa22.org
SMTP_PASS=your-app-password

# Application Settings
CHAPTER_NAME=EAA Chapter 22
CHAPTER_EMAIL=info@eaa22.org
VITE_CHAPTER_NAME=EAA Chapter 22

# Square Payments (optional)
SQUARE_ACCESS_TOKEN=your-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-key
SQUARE_WEBHOOK_URL=https://chapterforge.eaa22.org/api/payments/square/webhook
SQUARE_ENV=production
SQUARE_FEE_AMOUNT=1.00

# Firebase Auth (REQUIRED)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=chapterforge-vue.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chapterforge-vue
VITE_FIREBASE_STORAGE_BUCKET=chapterforge-vue.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
FIREBASE_SERVICE_ACCOUNT_PATH=./chapterforge-vue-firebase-adminsdk-fbsvc-8e7bf9e0fd.json
FIREBASE_ALLOWED_DOMAINS=eaa22.org
FIREBASE_ADMIN_EMAILS=josh.manring@eaa22.org
```

**Save file**: Ctrl+O, Enter, Ctrl+X

### Upload Firebase Credentials
From your **local machine** (PowerShell):
```powershell
cd "c:\Users\jmanr\seadrive_root\Josh\My Libraries\My Library\Code Projects\New - ChapterForge"
scp chapterforge-vue-firebase-adminsdk-fbsvc-8e7bf9e0fd.json nas@enterprise.local:/path/to/docker/apps/chapterforge-vue/
```

---

## Step 3: Build and Run Docker Container

### On Server Terminal
```bash
cd chapterforge-vue

# Build and start container
docker compose up -d --build

# View logs
docker logs chapterforge-vue-chapterforge-1 --tail 20

# Should see: "ChapterForge server running on http://localhost:3000"
```

### Verify Container is Running
```bash
docker ps | grep chapterforge
```

---

## Step 4: Configure Nginx Proxy Manager

1. **Open nginx proxy manager UI** (e.g., `https://npm.enterprise.local` or `http://localhost:81`)
2. **Create a new proxy host**:
   - **Domain Names**: `chapterforge.eaa22.org`
   - **Forward Hostname/IP**: `chapterforge-vue-chapterforge-1` (or `localhost` if external)
   - **Forward Port**: `3000`
   - **Enable SSL Certificate** (Let's Encrypt)
3. **Save** and wait for certificate generation

---

## Step 5: Configure Firebase

### Add Production Domain to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **chapterforge-vue** project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add: `chapterforge.eaa22.org`
5. Wait 5-10 minutes for propagation

---

## Step 6: Test Deployment

1. **Open browser** and navigate to `https://chapterforge.eaa22.org`
2. **Sign in** with your Google account (must be in `FIREBASE_ADMIN_EMAILS`)
3. **Verify features**:
   - ✅ Dashboard loads
   - ✅ Members page loads
   - ✅ Settings page accessible
   - ✅ Renewals page works
   - ✅ Reports page loads

---

## Updating Production Code

### When You Push Changes to GitHub

1. **On your local machine**, commit and push:
```powershell
git add .
git commit -m "Your changes here"
git push origin main
```

2. **On server**, pull and rebuild:
```bash
cd /path/to/docker/apps/chapterforge-vue
git pull origin main
docker compose down
docker compose up -d --build
```

3. **Verify**:
```bash
docker logs chapterforge-vue-chapterforge-1 --tail 20
```

---

## Database Backups

### Backup SQLite Database

**On server:**
```bash
# Create backup directory
mkdir -p ./backups

# Copy database
cp chapterforge.db ./backups/chapterforge.db.backup.$(date +%Y%m%d-%H%M%S)

# Download to local machine (from your local PowerShell):
# scp nas@enterprise.local:/path/to/chapterforge-vue/backups/* ./backups/
```

### Restore from Backup

```bash
# Stop container
docker compose stop

# Restore backup
cp ./backups/chapterforge.db.backup.YYYYMMDD-HHMMSS ./chapterforge.db

# Start container
docker compose up -d
```

---

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   docker logs chapterforge-vue-chapterforge-1
   ```

2. **Common issues**:
   - ❌ Missing `.env` file → Create it with all required values
   - ❌ Missing Firebase credentials → Upload the JSON file
   - ❌ Port 3000 in use → Change `PORT` in `.env`
   - ❌ Database permission errors → Delete `chapterforge.db` and restart

3. **Restart container**:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

### Firebase Auth Errors

- **"invalid-api-key"**: Check Firebase console authorized domains include `chapterforge.eaa22.org`
- **"auth/unauthorized"**: User must be in `FIREBASE_ADMIN_EMAILS` or added to allowlist in Settings

### Email Not Sending

1. Check SMTP credentials in `.env`
2. Verify email account allows "less secure apps" or use App Password
3. Test email in Settings → Email Template → Preview

---

## Production Checklist

- [ ] `.env` file created with all secrets
- [ ] Firebase credentials JSON uploaded
- [ ] Firebase authorized domains configured
- [ ] Docker container building and running
- [ ] Nginx proxy manager configured
- [ ] Domain resolves to server
- [ ] SSL certificate generated
- [ ] Users can sign in
- [ ] Database persists (not lost on restart)
- [ ] Backups scheduled
- [ ] Team trained on usage

---

## Support

For issues, check:
- Docker logs: `docker logs chapterforge-vue-chapterforge-1`
- Browser console: F12 → Console tab
- Firebase console: Check authorized domains and API keys
- Email settings: Settings → Email Template section

