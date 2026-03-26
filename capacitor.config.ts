import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aulapp.app',
  appName: 'AulApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
