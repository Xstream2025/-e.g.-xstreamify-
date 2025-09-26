// signin.mjs — Firebase with module-style imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQVGm0GY4vUDhTOVvTsMr8-buC6fhizHs",
  authDomain: "xstreamify-auth.firebaseapp.com",
  projectId: "xstreamify-auth",
  storageBucket: "xstreamify-auth.appspot.com",
  messagingSenderId: "868454287241",
  appId: "1:868454287241:web:fc3eef7bf0ddaef2cc5358"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign-in handler
async function doSignIn() {
  const email = document.getElementById("email")?.value || "";
  const password = document.getElementById("password")?.value || "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/profiles.html";
  } catch (err) {
    alert(err.message || "Sign-in failed");
    console.error(err);
  }
}

// Wire up the button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("signin-btn");
  if (btn) btn.addEventListener("click", doSignIn);
});
