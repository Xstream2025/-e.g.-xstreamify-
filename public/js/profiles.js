// public/js/profiles.js
// Renders the user pill (sign in link when logged out; name/email + sign out when logged in)

import { supabase, getUser, fetchProfile, upsertMyProfile } from "./db.js";

const pill = document.getElementById("user-pill");

function renderSignedOut() {
  if (!pill) return;
  pill.innerHTML = `<a href="./signin.html" style="color:#e5e7eb;text-decoration:none">Sign in</a>`;
}

function renderSignedIn({ user, profile }) {
  if (!pill) return;
  const name = profile?.display_name || user.email || "Account";
  pill.innerHTML = `
    <span style="opacity:.9">${escapeHtml(name)}</span>
    <button id="xsf-signout"
      style="background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:10px;padding:.35rem .6rem;cursor:pointer">
      Sign out
    </button>
  `;
  const btn = document.getElementById("xsf-signout");
  if (btn) {
    btn.onclick = async () => {
      await supabase.auth.signOut();
      location.href = "./signin.html";
    };
  }
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function init() {
  try {
    const user = await getUser();
    if (!user) { renderSignedOut(); return; }

    let profile = null;
    try { profile = await fetchProfile(); } catch (_) {}
    renderSignedIn({ user, profile });

    if (!profile) {
      try { await upsertMyProfile({ display_name: user.email }); } catch (_) {}
    }
  } catch (e) {
    console.error("profiles init error", e);
    renderSignedOut();
  }
}

// update pill when auth state changes
supabase.auth.onAuthStateChange(async (_ev, session) => {
  if (session?.user) {
    let profile = null;
    try { profile = await fetchProfile(); } catch (_) {}
    renderSignedIn({ user: session.user, profile });
  } else {
    renderSignedOut();
  }
});

init();
