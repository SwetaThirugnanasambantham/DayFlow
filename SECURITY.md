# Dayflow Security Specification & Rules Architecture

## 1. Zero-Trust Access Control (ABAC)

Dayflow enforces strict Attribute-Based Access Control and mathematical user tenant isolation.

### Core Security Invariants
1. **Default Deny**: Any path not explicitly matched is denied (`match /{document=**} { allow read, write: if false; }`).
2. **User Isolation**: A user can only access documents within `/users/{userId}/*` where `request.auth.uid == userId`.
3. **ID Sanitization**: Path variables are validated against alphanumeric patterns and maximum length limits (`isValidId(id)`).
4. **No Blanket Reads**: `allow list` evaluates resource data against `request.auth.uid` to prevent unauthorized query scraping.
5. **No Client Claim Reliance**: Custom claims are not used for authorization; authorization relies strictly on trusted server-side rules.

## 2. Deployed Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    match /users/{userId} {
      allow read, write: if isValidId(userId) && isOwner(userId);

      match /tasks/{taskId} {
        allow read, write: if isValidId(userId) && isValidId(taskId) && isOwner(userId);

        match /subtasks/{subtaskId} {
          allow read, write: if isValidId(userId) && isValidId(taskId) && isValidId(subtaskId) && isOwner(userId);
        }

        match /notes/{noteId} {
          allow read, write: if isValidId(userId) && isValidId(taskId) && isValidId(noteId) && isOwner(userId);
        }
      }

      match /routines/{routineId} {
        allow read, write: if isValidId(userId) && isValidId(routineId) && isOwner(userId);
      }

      match /routineOccurrences/{occurrenceId} {
        allow read, write: if isValidId(userId) && isValidId(occurrenceId) && isOwner(userId);
      }

      match /habits/{habitId} {
        allow read, write: if isValidId(userId) && isValidId(habitId) && isOwner(userId);
      }

      match /habitLogs/{logId} {
        allow read, write: if isValidId(userId) && isValidId(logId) && isOwner(userId);
      }

      match /focusSessions/{sessionId} {
        allow read, write: if isValidId(userId) && isValidId(sessionId) && isOwner(userId);
      }

      match /settings/{settingId} {
        allow read, write: if isValidId(userId) && isValidId(settingId) && isOwner(userId);
      }
    }
  }
}
```

## 3. Error Handling Architecture

Whenever any Firestore operation fails, `handleFirestoreError` generates a structured JSON payload conforming to the `FirestoreErrorInfo` interface with operation type, target path, and authentication state for precise diagnostics.
