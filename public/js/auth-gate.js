// /public/js/auth-gate.js  (DIAGNOSTIC VERSION)
// - Waits for Firebase session hydrate
// - Temporarily blocks redirects to /signin.html
// - Logs WHO/WHERE tried to redirect (call stack) so we can kill the culprit

import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { getApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

// ✅ Replace with your real config keys from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCQVGm0GY4vUDhTOVvTsMr8-buC6fhizHs",
  authDomain: "xstreamify-auth.firebaseapp.com",
  projectId: "xstreamify-auth",
  storageBucket: "xstreamify-auth.appspot.com",
  messagingSenderId: "860454287241",
  appId: "1:860454287241:web:fc3eef7bf0ddaeF2cc5358"
};



try {
  initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase already initialized");
}


const auth = getAuth(getApp());

try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}

const isSignInPage = location.pathname.endsWith("/signin.html");

// ---------- Guard + Logger for any redirects to /signin.html ----------
(function installRedirectLogger() {
  const loc = window.location;
  const ORIG = {
    assign: loc.assign ? loc.assign.bind(loc) : null,
    replace: loc.replace ? loc.replace.bind(loc) : null,
  };

  // Block window.open as a redirect vector too
  const ORIG_OPEN = window.open ? window.open.bind(window) : null;

  // For the first 6 seconds after page load we block /signin.html redirects
  // so we can see who is trying to do it.
  const BLOCK_UNTIL = Date.now() + 6000;

  function isSignin(url) {
    if (!url) return false;
    try { return new URL(url, loc.href).pathname.endsWith("/signin.html"); }
    catch { return String(url).includes("/signin.html"); }
  }

  function logAttempt(kind, url) {
    const stack = new Error(`[auth-gate] ${kind} → ${url}`).stack;
    console.warn("[auth-gate] Blocked redirect attempt to /signin.html via", kind, "from:", stack);
    // Surface visibly on the page too:
    try {
      let el = document.getElementById("auth-gate-log");
      if (!el) {
        el = document.createElement("pre");
        el.id = "auth-gate-log";
        el.style.cssText = "position:fixed;left:8px;bottom:8px;max-width:90vw;max-height:40vh;overflow:auto;z-index:99999;background:#111;color:#fff;padding:8px;border:1px solid #444;font:12px/1.4 monospace;white-space:pre-wrap";
        document.body.appendChild(el);
      }
      el.textContent = `[${new Date().toLocaleTimeString()}] Blocked redirect → /signin.html via ${kind}\n` + stack;
    } catch {}
  }

  function guardedNavigate(kind, url) {
    if (isSignin(url) && Date.now() < BLOCK_UNTIL) {
      logAttempt(kind, url);
      return; // block it for now
    }
    if (kind === "assign" && ORIG.assign) return ORIG.assign(url);
    if (kind === "replace" && ORIG.replace) return ORIG.replace(url);
  }

if (ORIG.assign) loc._assign = (url) => guardedNavigate("location.assign", url);
if (ORIG.replace) loc._replace = (url) => guardedNavigate("location.replace", url);
if (ORIG.open)
  win._open = (...args) => {
    if (isSignin(args[0]) && Date.now() < BLOCK_UNTIL) {
      logAttempt("window.open", args[0]);
      return null;
    }
    return ORIG.open(...args);
  };



  // Expose a safe navigator for the gate itself after auth is decided
  window.__authGateNavigate = (url, useReplace = true) => {
    if (useReplace && ORIG.replace) return ORIG.replace(url);
    if (ORIG.assign) return ORIG.assign(url);
    loc.href = url;
  };
})();
// ----------------------------------------------------------------------

let decided = false;
function decide(destination) {
  if (decided) return;
  decided = true;
  if (destination) window.__authGateNavigate(destination, true);
}

// Give Firebase time to hydrate before considering redirects
const GRACE_MS = 2000;
const graceTimer = setTimeout(() => {
  if (!isSignInPage && !auth.currentUser) decide("/signin.html");
  else decide(null);
}, GRACE_MS);

onAuthStateChanged(auth, (user) => {
  if (user) {
    clearTimeout(graceTimer);
    // Ensure a default profile so the app won't force /users.html
try {
  localStorage.setItem('selectedUser', 'Dad');
  localStorage.setItem('selectedProfile', 'Dad');
  localStorage.setItem('activeProfile', 'Dad');
} catch (_) {}
    if (isSignInPage) decide("/browse.html"); // signed in → go forward
    else decide(null);                           // stay where you are
  } else {
    // null for now; the grace timer will handle if needed
  }
});
// ⬇️ YOUR NEW CODE GOES HERE
// --- X-Streamify: Manual Sign-In Logic ---

const signinForm = document.getElementById('signin-form');
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ SIGNED IN:", user.email);
      window.location.href = '/users.html'; // redirect after success
    } catch (error) {
      console.error("❌ Sign-in failed:", error.message);
      alert("Sign-in failed. Please check your email or password.");
    }
  });
}
