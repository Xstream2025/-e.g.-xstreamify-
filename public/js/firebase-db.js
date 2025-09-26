// public/js/firebase-db.js

// Import Firebase config from keys.v3.js
import { firebaseConfig } from "./keys.v3.js";

// Import Firebase SDK modules you use
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized");

// Export commonly used services
export const auth = getAuth(app);
export const db = getFirestore(app);
