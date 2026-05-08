import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

const buildServiceWorkerUrl = () => {
  const params = new URLSearchParams(
    Object.entries(firebaseConfig).filter(([, value]) => Boolean(value)),
  );

  return `/firebase-messaging-sw.js?${params.toString()}`;
};

export const requestForToken = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser.');
      return null;
    }

    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
      console.warn('Firebase Cloud Messaging is not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was not granted.');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VITE_FIREBASE_VAPID_KEY is required to request an FCM token.');
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register(buildServiceWorkerUrl());
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (!currentToken) {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }

    return currentToken;
  } catch (err) {
    console.error('An error occurred while retrieving the FCM token.', err);
    return null;
  }
};
