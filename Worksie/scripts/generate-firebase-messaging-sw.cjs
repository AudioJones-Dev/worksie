const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packageLock = require('../package-lock.json');
const firebaseVersion = packageLock.packages?.['node_modules/firebase']?.version;

if (!firebaseVersion) {
  throw new Error('Unable to determine installed Firebase version from package-lock.json');
}

const serviceWorker = `/* global importScripts, firebase */
// Firebase Messaging service worker.
// This file lives in public/ and is served as-is, so it uses the Firebase compat
// SDK version installed by package-lock.json instead of an independently pinned version.
importScripts('https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js');

const firebaseConfig = Object.fromEntries(new URL(self.location.href).searchParams.entries());
// Query parameters are strings; reject both missing values and accidentally stringified
// undefined env vars before initializing Firebase in the service worker.
const isPresentFirebaseConfigValue = (value) => Boolean(value) && value !== 'undefined';
const hasRequiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.projectId,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(isPresentFirebaseConfigValue);

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
`;

writeFileSync(join(__dirname, '..', 'public', 'firebase-messaging-sw.js'), serviceWorker);
