// public/js/dbcodes.js
// Renders the library to the page using DB.getAll().

(function () {
  const contentEl = document.getElementById("content");

  async function renderLibrary() {
    try {
      const items = await (window.DB || window.db).getAll();

      if (!contentEl) return;

      if (!items.length) {
        contentEl.innerHTML = `
          <div style="padding:16px; font-size:14px; color:#555;">
            Your library is empty. Click <b>Add to Library</b> to add a movie.
          </div>`;
        return;
      }

      const cards = items
        .map((m, i) => {
          const safeTitle = (m.title || "Untitled")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `
            <div class="card">
              <div style="font-weight:700; font-size:18px">${safeTitle}</div>
              <div style="font-size:12px; color:#666;">#${i + 1}</div>
            </div>
          `;
        })
        .join("");

      contentEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${cards}
        </div>`;
    } catch (err) {
      console.error("[dbcodes] render failed:", err);
      if (contentEl) {
        contentEl.innerHTML = `<div style="color:#b00; padding:16px;">Render failed. See console.</div>`;
      }
    }
  }

  // Expose for buttons.js to call after DB.add()
  window.renderLibrary = renderLibrary;

  // Initial paint
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLibrary);
  } else {
    renderLibrary();
  }
})();
