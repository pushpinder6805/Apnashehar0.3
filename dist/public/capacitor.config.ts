import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pushpender.datafetcher',
  appName: 'Data Fetcher',
  webDir: 'dist/public',   // ✅ IMPORTANT
  bundledWebRuntime: false
};

export default config;

