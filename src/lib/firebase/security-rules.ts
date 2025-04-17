export const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Common functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Documents collection
    match /documents/{documentId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && isOwner(resource.data.userId);
      allow delete: if isSignedIn() && isOwner(resource.data.userId);
    }

    // User profiles
    match /users/{userId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isSignedIn() && isOwner(userId);
      allow delete: if isSignedIn() && isOwner(userId);
    }

    // Settings
    match /settings/{userId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow write: if isSignedIn() && isOwner(userId);
    }
  }
}

service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
                  && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                  && request.resource.contentType.matches('application/pdf|text/.*|application/.*document');
    }
  }
}
`;