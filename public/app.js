import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvQBLLbDyAWrWMEcDFKhY4sLSIGr5lWHM",
  authDomain: "xstreamify-auth.firebaseapp.com",
  projectId: "xstreamify-auth",
  storageBucket: "xstreamify-auth.appspot.com",
  messagingSenderId: "868454287241",
  appId: "1:868454287241:web:fc3eef7bf0ddaef2cc5358",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 👇 Attempt login from sign-in page
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm["email"].value;
    const password = loginForm["password"].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/users.html"; // ✅ redirect on login
    } catch (err) {
      alert(err.message);
    }
  });
}

// 👇 Redirect signed-in users automatically
onAuthStateChanged(auth, (user) => {
  if (user) {
    const currentPath = window.location.pathname;
    if (currentPath === "/signin.html") {
      window.location.href = "/users.html";
    }
  }
});
