/* global importScripts, firebase */
// Firebase Messaging service worker.
// This file lives in public/ and is served as-is, so it uses the compat SDKs
// from Firebase Hosting instead of bare module imports that require Vite bundling.
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

const firebaseConfig = Object.fromEntries(new URL(self.location.href).searchParams.entries());
const hasRequiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every((value) => value && value !== 'undefined');

if (hasRequiredConfig) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'Worksie';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.ico',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('Firebase messaging service worker was loaded without Firebase configuration.');
}
