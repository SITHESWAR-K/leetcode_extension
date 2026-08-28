# 🏢 LeetCode Company Tags & Interview Explorer

A complete developer toolset for company-wise LeetCode interview preparation:
1. **Chrome / Edge Extension**: Injects sleek, minimal inline company pills below problem titles with frequency badges and `+X more` expand toggles.
2. **React Web Application**: Full-featured standalone web dashboard for filtering problems by **Company** (660+ companies), **Duration** (30 days, 3 months, 6 months, all time), and **Difficulty**. Hosted live on **Firebase Hosting** at [https://leetcode-company-viewer.web.app](https://leetcode-company-viewer.web.app)!

---

## ⚡ 1. Browser Extension Setup (Chrome / Edge / Brave / Arc)

### Local Installation:
1. Clone this repository:
   ```bash
   git clone https://github.com/SITHESWAR-K/leetcode_extension.git
   cd leetcode_extension
   ```
2. Open your browser's extension manager:
   - **Microsoft Edge**: `edge://extensions/`
   - **Google Chrome / Brave / Arc**: `chrome://extensions/`
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **"Load unpacked"** (top-left).
5. Select the `leetcode_extension` root directory.
6. Open any problem on [LeetCode](https://leetcode.com/problems/interval-list-intersections/) to see company interview tags!

---

## 🔥 2. React Web App & Firebase Deployment

The web application lives in `web/` and is built with **React + Vite + Vanilla CSS Tokens**.

### Run Locally:
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Deploy to Firebase Hosting:
```bash
cd web
npm run deploy:firebase
```
Live URL: **[https://leetcode-company-viewer.web.app](https://leetcode-company-viewer.web.app)**

---

## 📦 3. Publishing to Extension Stores

### Microsoft Edge Add-ons (100% Free - $0 Developer Fee):
1. Sign in to the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
2. Click **"Create new extension"**.
3. Upload the pre-built zip package: `release/leetcode-company-tags-extension-v1.0.0.zip`.
4. Fill in the store listing and submit for review.

### Chrome Web Store:
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **"New item"** and upload `release/leetcode-company-tags-extension-v1.0.0.zip`.
3. Fill in the store listing and submit for review.

---

## 🛠️ Build & Verification Commands

From the root directory:
```bash
# Run all 24 automated verification checks
npm test

# Build all datasets and web app
npm run build:all

# Package release zip for store upload
npm run package

# Extract latest data from github dataset
npm run build:data
```

---

## 📁 Repository Architecture

```
leetcode_extension/
├── manifest.json                  # Manifest V3 extension configuration
├── package.json                   # Root scripts & runner
├── README.md                      # Documentation & guides
├── release/                       # Store release zip (Chrome & Edge ready)
├── scripts/
│   ├── build_dataset.js           # ETL parser for 660 companies CSVs
│   ├── generate_icons.js          # Icon generator (16, 48, 128)
│   ├── sync_web_assets.js         # Syncs JSON data to web/public
│   ├── sync_dashboard_to_extension.js # Syncs built web app to extension
│   ├── package_extension.js       # Packages release ZIP
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
