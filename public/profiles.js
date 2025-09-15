// public/js/profiles.js
// Phase 13: keep a profile row in sync + tiny user pill UI

import { supabase, getUser, fetchProfile, upsertMyProfile } from "./db.js";

/** Keep a profile row for the signed-in user */
supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user;
  if (!user) return;

  try {
    const fallbackName =
      user.user_metadata?.full_name ||
      (user.email ? user.email.split("@")[0] : "Streamer");
    await upsertMyProfile({ display_name: fallbackName, avatar_url: null });
  } catch (e) {
    console.warn("Profile upsert skipped/failed:", e?.message || e);
  }

  // After successful sign-in on signin.html, jump to home
  if (location.pathname.endsWith("/signin.html")) {
    location.href = "./index.html";
  }
});

/** Tiny header pill (optional: only renders if #user-pill exists) */
async function paintUserPill() {
  const pill = document.querySelector("#user-pill");
  if (!pill) return;

  const user = await getUser();
  if (!user) {
    pill.innerHTML = `<a href="./signin.html" style="text-decoration:none;">Sign in</a>`;
    return;
  }

  let display = user.email;
  try {
    const prof = await fetchProfile();
    if (prof?.display_name) display = prof.display_name;
  } catch {}

  pill.style.cssText =
    "display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;background:#111827;color:#e5e7eb;border:1px solid #374151;font:13px system-ui";
  pill.innerHTML = `
    <span title="${user.email}">${display}</span>
    <button id="btn-signout" style="all:unset;cursor:pointer;padding:2px 8px;border-radius:8px;background:#ef4444;color:#fff">Sign out</button>
  `;

  document.getElementById("btn-signout").onclick = async () => {
    await supabase.auth.signOut();
    location.href = "./signin.html";
  };
}
paintUserPill();
