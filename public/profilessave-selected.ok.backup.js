// /public/js/profiles.js
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("profiles-grid");
  if (!grid) return;

  // Avoid double-binding if the script is ever included twice
  if (grid.dataset.bound === "1") return;
  grid.dataset.bound = "1";

  // HTML already contains the 4 cards. We just handle navigation.
  grid.addEventListener("click", (ev) => {
    const link = ev.target.closest("a.card");
    if (!link) return;

    ev.preventDefault();
    const target = link.dataset.href || link.getAttribute("href") || "/browse.html";
    // (Optional) you can store selected profile id if you want later
    // const pid = link.dataset.profileId;
    window.location.href = target;
  });
});
