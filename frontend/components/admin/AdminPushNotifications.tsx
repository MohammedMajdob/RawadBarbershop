'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = '1bb8539b-a115-46fa-9fe4-819c388cd6de';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
    __oneSignalInited?: boolean;
  }
}

export default function AdminPushNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__oneSignalInited) return;
    window.__oneSignalInited = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });

        await OneSignal.User.addTag('role', 'admin');
      } catch (err) {
        console.error('OneSignal init failed', err);
      }
    });
  }, []);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      defer
    />
  );
}
