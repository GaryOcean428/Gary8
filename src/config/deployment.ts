export const deploymentConfig = {
  development: {
    apiUrl: 'http://localhost:3000',
    firebase: {
      useEmulator: true,
      emulatorPorts: {
        auth: 9099,
        firestore: 8080,
        storage: 9199
      }
    },
    logging: {
      level: 'debug',
      pretty: true
    }
  },
  production: {
    apiUrl: 'https://your-production-domain.com',
    firebase: {
      useEmulator: false
    },
    logging: {
      level: 'error',
      pretty: false
    }
  }
} as const;

export type Environment = keyof typeof deploymentConfig;
export type DeploymentConfig = typeof deploymentConfig[Environment];

export const getCurrentConfig = (): DeploymentConfig => {
  const env = process.env.NODE_ENV as Environment;
  return deploymentConfig[env] || deploymentConfig.development;
}; 