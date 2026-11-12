# Dayflow Deployment Guide

## 1. Web Application Deployment

Dayflow is built as a Progressive Web App (PWA) with Vite and React.

### Build Command
```bash
npm run build
```
The output is bundled into the `dist/` directory, optimized with code-splitting, asset hashing, and service worker registration.

### Firebase Hosting Deployment
If deploying via Firebase CLI:
```bash
firebase deploy --only hosting
```

Or deploy security rules:
```bash
firebase deploy --only firestore:rules
```

## 2. Progressive Web App (PWA) Installation

- **Chromium / Android / Desktop Chrome & Edge**: An "Install App" button appears in the navbar/sidebar and triggers the native install dialog via `beforeinstallprompt`.
- **iOS Safari**: Tap the Share icon in the Safari toolbar and select **Add to Home Screen**. A high-resolution PNG icon (`/apple-touch-icon.png`) and standalone display mode are preconfigured.

## 3. Desktop Companion (Windows / macOS / Linux)

Dayflow is designed for straightforward packaging into a native desktop companion via **Tauri** or **Electron**:
1. Run `npm run build`
2. Configure `tauri.conf.json` or `electron-main.js` targeting the `dist/` folder
3. Set `alwaysOnTop: true` and `frame: false` for the floating HUD mode
4. Build the executable (`cargo tauri build` or `electron-builder`)
