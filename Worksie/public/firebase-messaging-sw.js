// Firebase Cloud Messaging service worker.
//
// This file runs in a worker context that CANNOT read Vite env vars
// (`import.meta.env` is undefined here). It loads its Firebase web
// config at runtime from the sibling file
// `firebase-messaging-sw-config.js`, which is gitignored on purpose.
//
// Setup:
//   1. Copy `firebase-messaging-sw-config.example.js` to
//      `firebase-messaging-sw-config.js` in this directory.
//   2. Fill in the same Firebase web config values you put in
//      `Worksie/.env`.
//
// Do NOT paste real Firebase config into this file. See
// docs/SECURITY.md for the rationale.

importScripts("./firebase-messaging-sw-config.js");

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = self.__WORKSIE_FIREBASE_CONFIG__;

if (!firebaseConfig || !firebaseConfig.apiKey) {
  // Surface a clear error instead of silently failing. The service
  // worker will still register, but push notifications will not work
  // until the config file is in place.
  console.error(
    "[firebase-messaging-sw] Missing firebase-messaging-sw-config.js. " +
      "Copy firebase-messaging-sw-config.example.js and fill in your " +
      "Firebase web config. See docs/SECURITY.md."
  );
}

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log("[firebase-messaging-sw] background message", payload);
  const notificationTitle = payload?.notification?.title ?? "Worksie";
  const notificationOptions = {
    body: payload?.notification?.body ?? "",
    icon: "/favicon.ico",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
