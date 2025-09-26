// public/js/buttons.js
// Minimal UI wiring: add items and render the library

(function () {
  const $addBtn  = document.getElementById('addToLibraryBtn');
  const $list    = document.getElementById('list');
  const $empty   = document.getElementById('emptyMsg');

  // --- Render all items currently in DB ---
  async function render() {
    if (!window.DB && !window.db) {
      console.error("[BOOT] db.js missing – no DB/db on window");
      return;
    }
    const DB = window.DB || window.db;

    const items = await DB.getAll();
    // empty state
    if (!items.length) {
      $empty.style.display = "";
      $list.innerHTML = "";
      return;
    }
    $empty.style.display = "none";

    // Build simple list
    const html = items.map(item => {
      const title = (item.title || "").trim() || "Untitled";
      const year  = (item.year  || "").toString().trim();
      const extra = year ? ` (${year})` : "";
      return `<li style="padding:10px 0;border-bottom:1px solid #eee;">
                <div style="font-weight:600;">${title}${extra}</div>
                ${item.poster ? `<img src="${item.poster}" alt="" style="max-height:80px;margin-top:6px;">` : ``}
              </li>`;
    }).join("");

    $list.innerHTML = html;
  }

  // --- Add button flow (prompt-based) ---
  async function onAdd() {
    const title = prompt("Movie title?", "");
    if (!title) return;

    const year  = prompt("Year? (optional)", "");
    const poster = prompt("Poster URL? (optional)", "");

    const DB = window.DB || window.db;
    await DB.add({ title, year, poster });
    await render();
  }

  // Wire up
  if ($addBtn) $addBtn.addEventListener('click', onAdd);

  // Initial paint after scripts have loaded
  window.addEventListener('DOMContentLoaded', render);

  // Expose for quick testing in console
  window.renderLibrary = render;
})();
