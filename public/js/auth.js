// /public/js/auth.js
// Initialize Firebase app + export helpers for the rest of the site.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// ✅ Your Firebase project (xstreamify-auth)
const firebaseConfig = {
  apiKey: "AIzaSyDFXRlF20221g5tYWypyrfQf58C0S0wMBfU",
  authDomain: "xstreamify-auth.firebaseapp.com",
  projectId: "xstreamify-auth",
  storageBucket: "xstreamify-auth.appspot.com",
  messagingSenderId: "868454287241",
  appId: "1:868454287241:web:fc3eef7bf0ddaef2cc5358"
};

// Only init once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth (sticky session to prevent flash → bounce)
const auth = getAuth(app);
try {
  await setPersistence(auth, browserLocalPersistence);
} catch (_) {
  // no-op
}

// Expose for other modules if they import this file
export { app, auth };
