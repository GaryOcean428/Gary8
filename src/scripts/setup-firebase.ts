import * as fs from 'fs';
import * as path from 'path';

const defaultFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export const setupFirebaseRules = () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    fs.writeFileSync(rulesPath, defaultFirestoreRules);
    console.log('✅ Created default Firestore rules');
  }
}; 