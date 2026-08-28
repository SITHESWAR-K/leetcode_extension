# 🏢 LeetCode Company Tags & Interview Explorer

A complete developer toolset for company-wise LeetCode interview preparation:
1. **Chrome / Edge Extension**: Injects sleek, minimal inline company pills below problem titles with frequency badges and `+X more` expand toggles.
2. **React Web Application**: Full-featured standalone web dashboard for filtering problems by **Company** (660+ companies), **Duration** (30 days, 3 months, 6 months, all time), and **Difficulty**. Ready for **Firebase Hosting**!

---

## ⚡ 1. Chrome Extension Setup

### Load Unpacked in Chrome / Edge / Brave / Arc
1. Go to `chrome://extensions/` (or `edge://extensions/`).
2. Turn on **Developer mode** (top-right toggle).
3. Click **"Load unpacked"** (top-left).
4. Select this directory:
   ```
   c:\Users\sithe\OneDrive\Desktop\web_dev\leetcode_extension
   ```
5. Visit any problem on [LeetCode](https://leetcode.com/problems/interval-list-intersections/) to see the sleek inline pills!

---

## 🔥 2. React Web App & Firebase Deployment

The web application lives in `web/` and is built with **React + Vite + Vanilla CSS Tokens**.

### Run Locally:
```bash
cd web
npm run dev
```
Open `http://localhost:3000` in your browser.

### Deploy to your Firebase Project:
1. Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Set your Firebase project ID:
   ```bash
   cd web
   firebase use --add YOUR_PROJECT_ID
   ```
4. Deploy to Firebase Hosting:
   ```bash
   npm run deploy:firebase
   ```
Your web app will be live at `https://YOUR_PROJECT_ID.web.app`!

---

## 📦 3. Publishing to the Chrome Web Store

1. Zip the extension folder (excluding `web/node_modules/`, `raw_data/`, and `.git/`).
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Pay the $5 one-time developer registration fee.
4. Click **"New item"** and upload your zip file.
5. Provide store listing details (icons are located in `src/assets/icon128.png`, screenshots can be captured from LeetCode and the web app).
6. Click **"Submit for review"**.

---

## 🛠️ Build & Verification Commands

From the root directory:
```bash
# Run all 24 verification checks
npm test

# Build all datasets and web app
npm run build:all

# Extract latest data from github repo
npm run build:data
```

---

## 📁 Repository Architecture

```
leetcode_extension/
├── manifest.json                  # Manifest V3 extension configuration
├── package.json                   # Root scripts & runner
├── README.md                      # Documentation & guides
├── scripts/
│   ├── build_dataset.js           # ETL parser for 660 companies CSVs
│   ├── generate_icons.js          # Icon generator (16, 48, 128)
│   ├── sync_web_assets.js         # Syncs JSON data to web/public
│   ├── sync_dashboard_to_extension.js # Syncs built web app to extension
│   └── verify_extension.js        # 24 verification unit tests
├── src/
│   ├── assets/                    # Icons (16, 48, 128)
│   ├── data/                      # 3,399 problems & 660 companies indexed JSONs
│   ├── content/                   # Content scripts (inline pills, debounce)
│   │   ├── content.js
│   │   └── content.css
│   ├── popup/                     # Toolbar popup UI
│   └── dashboard/                 # Offline bundled React web dashboard
└── web/                           # React + Vite Web App (Firebase Hosting ready)
    ├── package.json
    ├── vite.config.js
    ├── firebase.json              # Firebase Hosting configuration
    ├── .firebaserc                # Firebase project configuration
    ├── index.html
    └── src/
        ├── App.jsx                # Full Company & Timeframe explorer
        ├── index.css              # Dark & light theme design system
        └── main.jsx
```
