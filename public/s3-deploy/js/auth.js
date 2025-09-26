// public/js/auth.js
// Phase 12 — Email/Password Auth + Password Reset (Supabase JS v2)

const SUPABASE_URL  = window.__SUPABASE_URL__;
const SUPABASE_ANON = window.__SUPABASE_ANON__;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  alert("Missing SUPABASE_URL or SUPABASE_ANON. Open signin.html and paste your keys.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Elements
const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");
const authForm = $("#auth-form");
const resetForm = $("#reset-form");
const newPassForm = $("#newpass-form");

const btnSignIn = $("#btn-signin");
const btnSignUp = $("#btn-signup");
const btnReset = $("#btn-reset");
const btnUpdatePass = $("#btn-update-pass");

const email = $("#email");
const password = $("#password");
const resetEmail = $("#reset-email");
const newPassword = $("#new-password");
const showResetLink = $("#show-reset");

// Helpers
function showMsg(text, ok=false){
  msg.textContent = text;
  msg.className = "msg " + (ok ? "ok":"err");
  msg.style.display = "block";
}
function clearMsg(){ msg.style.display = "none"; }
function setBusy(el, busy=true){
  if (!el) return;
  el.disabled = busy;
  el.dataset.busy = busy ? "1" : "0";
  el.textContent = busy ? "Please wait..." : el.dataset.label || el.textContent;
}

// Show/hide reset panel
showResetLink?.addEventListener("click", () => {
  resetForm.style.display = resetForm.style.display === "none" ? "block" : "none";
});

// Sign In
btnSignIn?.addEventListener("click", async (e) => {
  e.preventDefault(); clearMsg();
  btnSignIn.dataset.label = "Sign In"; setBusy(btnSignIn, true);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });
  setBusy(btnSignIn, false);
  if (error) return showMsg(error.message);
  showMsg("Signed in! Redirecting…", true);
  // Go to app home
  location.href = "./index.html";
});

// Sign Up
btnSignUp?.addEventListener("click", async () => {
  clearMsg();
  btnSignUp.dataset.label = "Create Account"; setBusy(btnSignUp, true);
  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
  });
  setBusy(btnSignUp, false);
  if (error) return showMsg(error.message);
  showMsg("Account created. Check your email to confirm (if required).", true);
});

// Send reset email
resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault(); clearMsg();
  btnReset.dataset.label = "Send reset email"; setBusy(btnReset, true);
  const redirectTo = new URL("./signin.html", location.href).href;
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    (resetEmail.value || email.value).trim(),
    { redirectTo }
  );
  setBusy(btnReset, false);
  if (error) return showMsg(error.message);
  showMsg("Reset email sent. Check your inbox.", true);
});

// Handle password recovery deep link
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    newPassForm.style.display = "block";
    showMsg("Enter a new password to complete the reset.", true);
  }
});

// Update password after recovery
newPassForm?.addEventListener("submit", async (e) => {
  e.preventDefault(); clearMsg();
  btnUpdatePass.dataset.label = "Update password"; setBusy(btnUpdatePass, true);
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword.value
  });
  setBusy(btnUpdatePass, false);
  if (error) return showMsg(error.message);
  showMsg("Password updated. You’re signed in!", true);
  setTimeout(()=> location.href = "./index.html", 800);
});

// Optional: if already signed in, bounce to app
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.href = "./index.html";
})();
