// /public/js/db.js

// Import Firebase SDKs (v9 CDN)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Ensure keys.js ran first
if (!window.firebaseConfig) {
  throw new Error("keys.js did not load. Make sure /js/keys.js is included BEFORE /js/db.js");
}

// Single default app
const app = getApps().length ? getApp() : initializeApp(window.firebaseConfig);

// Export services for other modules
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ Firebase initialized");
