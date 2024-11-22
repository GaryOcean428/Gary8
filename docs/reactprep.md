# Gary8 Project Setup Guide

## Project Structure

```
D:\Dev2\Gary8\Gary8-Project\
├── src\
│   ├── app\
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib\
│       ├── agents\
│       ├── canvas\
│       ├── context\
│       ├── documents\
│       ├── error\
│       └── firebase\
│           └── config.ts
├── public\
├── package.json
├── next.config.js
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
└── .env
```

## Setup Steps

1. **Initial Setup Commands**

```bash
# Windows (PowerShell)
npx create-next-app@latest gary8-project --typescript --tailwind --app --src-dir
cd gary8-project

# Linux/Mac
npx create-next-app@latest gary8-project --typescript --tailwind --app --src-dir
cd gary8-project
```

2. **Install Required Dependencies**

```bash
# Windows/Linux/Mac
npm install fabric @firebase/app @firebase/firestore @firebase/auth @firebase/storage
npm install -D @types/fabric
```

3. **Environment Setup**

Create a `.env` file in the root directory:

```plaintext
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Create Required Directory Structure**

```bash
# Windows (PowerShell)
mkdir -p src/lib/{agents,canvas,context,documents,error,firebase}

# Linux/Mac
mkdir -p src/lib/{agents,canvas,context,documents,error,firebase}
```

5. **Start Development Server**

```bash
npm run dev
```

## Important Configuration Files

1. **next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config) => {
        config.externals = [...config.externals, { canvas: 'canvas' }];
        return config;
    },
};

module.exports = nextConfig;
```

2. **tsconfig.json** (verify these options are present)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Verification Steps

1. Run `npm run dev` and verify no errors in console
2. Check http://localhost:3000 loads correctly
3. Verify Firebase configuration works by testing a simple query
4. Ensure Fabric.js can be imported without errors

## Common Issues and Solutions

1. If you see canvas-related errors:
   - Ensure node-canvas is properly installed
   - Check webpack configuration in next.config.js

2. For Firebase errors:
   - Verify all environment variables are correctly set
   - Check Firebase configuration in src/lib/firebase/config.ts

3. For TypeScript errors:
   - Run `npm install --save-dev @types/node @types/react @types/react-dom`
   - Ensure tsconfig.json is properly configured

## Next Steps

1. Set up authentication flows
2. Create basic layout components
3. Configure Firebase security rules
4. Set up testing environment
5. Implement CI/CD pipeline

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Fabric.js Documentation](http://fabricjs.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

