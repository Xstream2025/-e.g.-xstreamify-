// public/js/buttons.js
// Wires UI buttons to the DB helper (db.js) and render helpers (dbcodes.js).

(function () {
  function onReady() {
    const addBtn = document.getElementById("addToLibraryBtn");
    if (!addBtn) {
      console.error("[buttons] #addToLibraryBtn not found");
      return;
    }

    addBtn.addEventListener("click", async () => {
      try {
        const title = window.prompt("Movie title:", "Braveheart");
        if (!title || !title.trim()) return;

        const item = {
          title: title.trim(),
          year: "",
          poster: "",
        };

        await (window.DB || window.db).add(item);
        await window.renderLibrary(); // from dbcodes.js
      } catch (err) {
        console.error("[buttons] Add failed:", err);
        alert("Add failed. See console for details.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
