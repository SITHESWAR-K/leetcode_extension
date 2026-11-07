# LeetCode Company Tags & Interview Explorer

A complete developer toolset for company-wise LeetCode interview preparation:
1. **Microsoft Edge Add-on & Chrome Extension**: Injects sleek, minimal inline company pills below problem titles with frequency badges and recency data directly inside LeetCode. Available on [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/leetcode-company-tags-f/doaaobpiiccnfcepjjkbogeacmmcpneb)!
2. **React Web Application**: Standalone web dashboard for filtering problems by **Company** (660+ companies), **Duration** (30 days, 3 months, 6 months, all time), and **Difficulty**. Hosted live on **Firebase Hosting** at [https://leetcode-company-viewer.web.app](https://leetcode-company-viewer.web.app).

---

## 🚀 Microsoft Edge Add-ons Store (Live)

Install with a single click directly from the Microsoft Edge store:
👉 **[Download on Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/leetcode-company-tags-f/doaaobpiiccnfcepjjkbogeacmmcpneb)**

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

## 🤖 4. Automated Periodic Updates (GitHub Actions)

This repository includes a scheduled GitHub Actions workflow [`.github/workflows/update_datasets.yml`](.github/workflows/update_datasets.yml) that:
1. **Pulls the latest interview questions dataset** from upstream every **Sunday at 02:00 UTC**.
2. **Rebuilds all indexes and JSON datasets** (`problem_to_companies.json`, `company_to_problems.json`, `companies_meta.json`).
3. **Rebuilds the React web dashboard and offline extension bundle**.
4. **Runs all 24 verification checks** (`npm test`).
5. **Auto-commits and pushes** the updated data back to the GitHub repository.
6. **Auto-deploys to Firebase Hosting** (if `FIREBASE_SERVICE_ACCOUNT_LEETCODE_COMPANY_VIEWER` or `FIREBASE_TOKEN` repository secret is configured).

> **Manual Trigger**: You can also trigger an immediate update at any time under **GitHub → Actions → Sync & Update LeetCode Datasets → Run workflow**.

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
