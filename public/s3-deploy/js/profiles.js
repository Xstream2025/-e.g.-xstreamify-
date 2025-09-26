// profiles.js
import { XSF_DB } from "./db.js";

// DOM elements
const profileForm = document.querySelector("#profile-form");
const usernameInput = document.querySelector("#username");
const profileMsg = document.querySelector("#profile-msg");

// Save profile
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  profileMsg.textContent = "Saving profile...";

  try {
    const username = usernameInput.value.trim();
    if (!username) {
      profileMsg.textContent = "Username required.";
      return;
    }

    // Save to Supabase via db.js helper
    await XSF_DB.saveProfile({ username });
    profileMsg.textContent = "Profile saved!";
  } catch (err) {
    console.error("Save profile error:", err);
    profileMsg.textContent = err.message || "Failed to save profile.";
  }
});

// Load profile (if exists)
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const profile = await XSF_DB.loadProfile();
    if (profile && profile.username) {
      usernameInput.value = profile.username;
      profileMsg.textContent = "Profile loaded.";
    }
  } catch (err) {
    console.warn("No profile loaded:", err.message);
  }
});
