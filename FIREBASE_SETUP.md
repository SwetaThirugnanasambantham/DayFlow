# Firebase Setup & Configuration Guide

Dayflow is provisioned on Firebase using Cloud Firestore Enterprise Edition and Firebase Authentication.

## Configuration Details

Configuration is loaded from `firebase-applet-config.json` at the root of the project:

```json
{
  "projectId": "neon-mind-mrrhs",
  "appId": "1:874162191858:web:7bca6e3b785f85d5317f6b",
  "apiKey": "AIzaSyBrI417OuQy9XRPXVGPB49GKtheT93Vb-s",
  "authDomain": "neon-mind-mrrhs.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-dayflowpersonalp-3a75ac90-bc7a-436a-98a1-5cb29bce0363",
  "storageBucket": "neon-mind-mrrhs.firebasestorage.app",
  "messagingSenderId": "874162191858"
}
```

## Authentication Providers

1. **Google Identity Provider**: Configured with `signInWithPopup` using `googleProvider.setCustomParameters({ prompt: 'select_account' })`.
2. **Email & Password**: Supports user registration, login, and password reset flows.
3. **Demo / Explorer Mode**: Instant offline guest mode stored locally for zero-friction evaluation.

## Initial Connection Test

On startup, Dayflow executes a non-blocking test:
```typescript
import { doc, getDocFromServer } from 'firebase/firestore';
await getDocFromServer(doc(db, 'test', 'connection'));
```
If the client is offline, it gracefully falls back to IndexedDB local caching.
