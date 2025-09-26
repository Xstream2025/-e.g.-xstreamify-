// /public/js/profiles.js
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("profiles-grid");
  if (!grid) return;

  // Guard against double-binding
  if (grid.dataset.bound === "1") return;
  grid.dataset.bound = "1";

  grid.addEventListener("click", (ev) => {
    const link = ev.target.closest("a.card");
    if (!link) return;

    ev.preventDefault();

    // Collect profile info from the clicked card
    const pid = link.dataset.profileId || "";
    const nameEl = link.querySelector(".name");
    const imgEl = link.querySelector("img");
    const profile = {
      id: pid,
      name: nameEl ? nameEl.textContent.trim() : "",
      img: imgEl ? imgEl.getAttribute("src") : ""
    };

    try {
      localStorage.setItem("xs_profile", JSON.stringify(profile));
    } catch (e) {
      // ignore storage errors
    }

    const target = link.dataset.href || link.getAttribute("href") || "/browse.html";
    window.location.href = target;
  });
});
