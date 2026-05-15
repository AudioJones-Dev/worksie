// Template for `firebase-messaging-sw-config.js`.
//
// The Firebase messaging service worker (`firebase-messaging-sw.js`)
// runs in a context that cannot read Vite env vars, so it imports its
// Firebase web config from this sibling file at runtime.
//
// Setup:
//   1. Copy this file to `firebase-messaging-sw-config.js` in the same
//      directory. That target filename is gitignored on purpose.
//   2. Replace the __PLACEHOLDER__ values with the same Firebase web
//      config values you put in `Worksie/.env` (the keys must match).
//
// Do NOT commit `firebase-messaging-sw-config.js`. See docs/SECURITY.md.

self.__WORKSIE_FIREBASE_CONFIG__ = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
};
