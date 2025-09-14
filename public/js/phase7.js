/* Phase 7 web app – robust, null-safe version */

(() => {
  "use strict";

  // --- DOM
  const grid = document.getElementById("grid");
  const searchInput = document.getElementById("searchInput");
  const resultCount = document.getElementById("resultCount");

  const btnAll = document.getElementById("pillAll");
  const btnRecent = document.getElementById("pillRecent");
  const btnFav = document.getElementById("pillFav");

  // --- Data (use existing window.movies if present, else fallback demo list)
  window.movies =
    Array.isArray(window.movies) && window.movies.length
      ? window.movies
      : [
          {
            id: "m1",
            title: "The Dark Knight",
            year: 2008,
            poster:
              "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            addedAt: Date.now() - 1_000_000,
          },
          {
            id: "m2",
            title: "Avatar (Picture)",
            year: 2009,
            poster:
              "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2tcJjLkki24Mlp7u.jpg",
            addedAt: Date.now() - 2_000_000,
          },
          {
            id: "m3",
            title: "Interstellar",
            year: 2014,
            poster:
              "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            addedAt: Date.now() - 3_000_000,
          },
        ];

  // --- Favorites (persist to localStorage)
  const FAV_KEY = "xsf-favs";
  let favIds = new Set(
    JSON.parse(localStorage.getItem(FAV_KEY) || "[]").filter(Boolean)
  );
  function saveFavs() {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favIds]));
  }

  // --- Helpers

  /** remove 'active' from all pills, then add to btn (if provided) */
  function setActive(btn) {
    document
      .querySelectorAll("#pillAll,#pillRecent,#pillFav")
      .forEach((el) => el.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }

  /** returns the id of the active pill, or 'pillAll' if none is active yet */
  function activePillId() {
    return (
      document.querySelector(
        "#pillAll.active,#pillRecent.active,#pillFav.active"
      )?.id || "pillAll"
    );
  }

  function isFav(id) {
    return favIds.has(id);
  }

  function toggleFav(id) {
    if (favIds.has(id)) favIds.delete(id);
    else favIds.add(id);
    saveFavs();
  }

  /** render the grid from a list of movie objects */
  function renderGrid(list) {
    const html = list
      .map((m) => {
        const fav = isFav(m.id);
        return `
          <div class="aspect-[2/3] rounded bg-white/5 ring-1 ring-white/10 overflow-hidden relative"
               data-id="${m.id}">
            <img src="${m.poster}" alt="${m.title}"
                 class="w-full h-64 sm:h-72 object-cover" />
            <div class="p-2 text-xs">
              <div class="font-semibold truncate">${m.title}</div>
              <div class="text-white/60">${m.year ?? ""}</div>
            </div>
            <button class="fav absolute top-2 right-2 text-lg leading-none"
                    aria-label="Favorite" title="Favorite">
              ${fav ? "★" : "☆"}
            </button>
          </div>
        `;
      })
      .join("");

    grid.innerHTML = html;
    resultCount.textContent = list.length.toString();
  }

  /** compute filtered/sorted results and render */
  function applyFilters() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const mode = activePillId(); // 'pillAll' | 'pillRecent' | 'pillFav'

    // 1) search
    let list = window.movies.filter((m) =>
      (m.title || "").toLowerCase().includes(q)
    );

    // 2) mode
    if (mode === "pillFav") {
      list = list.filter((m) => isFav(m.id));
    } else if (mode === "pillRecent") {
      list = list
        .slice()
        .sort(
          (a, b) =>
            (b.addedAt ?? 0) - (a.addedAt ?? 0) || (b.year ?? 0) - (a.year ?? 0)
        );
    }

    renderGrid(list);
  }

  // --- Events

  // clicks on the pills
  btnAll.addEventListener("click", () => {
    setActive(btnAll);
    applyFilters();
  });
  btnRecent.addEventListener("click", () => {
    setActive(btnRecent);
    applyFilters();
  });
  btnFav.addEventListener("click", () => {
    setActive(btnFav);
    applyFilters();
  });

  // typing in the search box
  searchInput.addEventListener("input", () => applyFilters());

  // toggle favorites (event delegation on the grid)
  grid.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains("fav")) return;

    const card = t.closest("[data-id]");
    if (!card) return;
    const id = card.getAttribute("data-id");
    if (!id) return;

    toggleFav(id);
    // re-render current view to reflect the change
    applyFilters();
  });

  // --- First render (ensure a pill is selected to avoid nulls)
  setActive(btnAll);
  applyFilters();
})();
