# Deployment Documentation

## Firebase Hosting

Agent One is deployed using Firebase Hosting, providing fast and secure hosting with automatic SSL and global CDN.

### Project Details
- **Name**: agent-one
- **ID**: agent-one-ffec8
- **Number**: 425089133667
- **Environment**: Production
- **Organization**: skillhiregto.com.au
- **Public Name**: Gary8
- **Support**: braden.lang@skillhiregto.com.au

### Commands

- `npm run deploy` - Build and deploy to production
- `npm run deploy:preview` - Build and deploy to preview channel
- `npm run firebase:emulate` - Run local emulator

### Configuration Files

- `.firebaserc` - Project and target configuration
- `firebase.json` - Hosting and site configuration
- `.env` - Environment variables and Firebase keys

### Deployment Process

1. Build the application:
