// public/js/library-adapter.js
// Renders the Add-a-Movie form + "My Library" grid

import XSF_DB, { supabase } from "./db.js";

function $(id) { return document.getElementById(id); }

async function renderLibrary() {
  const list = $("library-list");
  const empty = $("library-empty");
  const loading = $("library-loading");

  try {
    loading.classList.remove("hidden");
    empty.classList.add("hidden");
    list.innerHTML = "";

    const items = await XSF_DB.listLibraryItems();
    console.log("[library] items:", items);

    if (!items || items.length === 0) {
      empty.classList.remove("hidden");
    } else {
      for (const item of items) list.appendChild(renderCard(item));
    }
  } catch (err) {
    console.error("[library] render error:", err);
    alert(err.message || "Failed to load your library.");
  } finally {
    loading.classList.add("hidden");
  }
}

function renderCard(item) {
  const card = document.createElement("div");
  card.className = "flex gap-4 items-center p-4 rounded-xl border bg-white shadow-sm";

  // Poster
  const posterWrap = document.createElement("div");
  posterWrap.className = "w-40 h-60 rounded bg-gray-200 flex items-center justify-center overflow-hidden shrink-0";
  if (item.poster_url) {
    const img = document.createElement("img");
    img.src = item.poster_url;
    img.alt = item.title;
    img.className = "w-full h-full object-cover";
    img.onerror = () => { posterWrap.textContent = "No Poster"; };
    posterWrap.appendChild(img);
  } else {
    posterWrap.textContent = "No Poster";
    posterWrap.className += " text-gray-500 font-semibold";
  }

  // Info
  const right = document.createElement("div");
  right.className = "flex-1";

  const title = document.createElement("div");
  title.className = "text-lg font-semibold mb-1";
  title.textContent = item.title;

  const meta = document.createElement("div");
  meta.className = "text-sm text-gray-500 mb-3";
  meta.textContent = item.year ? `Year: ${item.year}` : "";

  const actions = document.createElement("div");
  actions.className = "text-sm";
  const rename = document.createElement("button");
  rename.className = "text-blue-600 hover:underline mr-3";
  rename.textContent = "Rename";
  rename.onclick = async () => {
    const val = prompt("New title:", item.title);
    if (!val || !val.trim()) return;
    await XSF_DB.renameLibraryItem(item.id, val.trim());
    await renderLibrary();
  };

  const del = document.createElement("button");
  del.className = "text-red-600 hover:underline";
  del.textContent = "Delete";
  del.onclick = async () => {
    if (!confirm(`Delete “${item.title}”?`)) return;
    await XSF_DB.deleteLibraryItem(item.id);
    await renderLibrary();
  };

  actions.append(rename, del);
  right.append(title, meta, actions);
  card.append(posterWrap, right);
  return card;
}

async function onAddClick() {
  const titleEl = $("add-title");
  const posterEl = $("add-poster");
  const yearEl = $("add-year");
  const btn = $("add-btn");

  const title = titleEl.value.trim();
  const poster = posterEl.value.trim();
  const yearStr = yearEl.value.trim();

  if (!title) {
    alert("Please enter a title.");
    return;
  }

  const year = yearStr ? parseInt(yearStr, 10) : null;
  if (yearStr && Number.isNaN(year)) {
    alert("Year must be a number, e.g. 1995");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Adding…";

    await XSF_DB.addLibraryItem({
      title,
      poster_url: poster || null,
      year,
    });

    titleEl.value = "";
    posterEl.value = "";
    yearEl.value = "";

    await renderLibrary();
  } catch (err) {
    console.error("[library] add error:", err);
    alert(err.message || "Add failed");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add to Library";
  }
}

function wireUp() {
  $("add-btn")?.addEventListener("click", onAddClick);
  renderLibrary();

  supabase.auth.onAuthStateChange(() => renderLibrary());
}

// Init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireUp, { once: true });
} else {
  wireUp();
}
