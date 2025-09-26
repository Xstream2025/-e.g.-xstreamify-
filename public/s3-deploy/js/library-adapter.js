// UI-polished library adapter: grid cards, hover lift, tidy actions
import XSF_DB, { supabase } from "./db.js";

const $ = (id) => document.getElementById(id);

function card({ title, poster_url, year, id }) {
  const wrap = document.createElement("article");
  wrap.className =
    "group rounded-2xl border bg-white shadow-sm overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md";

  const posterBox = document.createElement("div");
  posterBox.className = "aspect-[2/3] bg-gray-200 relative";
  if (poster_url) {
    const img = document.createElement("img");
    img.src = poster_url;
    img.alt = title;
    img.className = "absolute inset-0 w-full h-full object-cover";
    img.onerror = () => (posterBox.innerHTML = `<div class="w-full h-full grid place-items-center text-gray-500">No Poster</div>`);
    posterBox.appendChild(img);
  } else {
    posterBox.innerHTML = `<div class="w-full h-full grid place-items-center text-gray-500">No Poster</div>`;
  }

  const body = document.createElement("div");
  body.className = "p-4 space-y-2";

  const titleEl = document.createElement("h3");
  titleEl.className = "font-semibold leading-tight";
  titleEl.textContent = title;

  const sub = document.createElement("div");
  sub.className = "text-sm text-gray-500";
  sub.textContent = year ? `Year: ${year}` : "";

  const actions = document.createElement("div");
  actions.className = "pt-2 flex items-center gap-4 text-sm";

  const btnRename = document.createElement("button");
  btnRename.className = "text-blue-600 hover:underline";
  btnRename.textContent = "Rename";
  btnRename.onclick = async () => {
    const val = prompt("New title:", title);
    if (!val || !val.trim()) return;
    await XSF_DB.renameLibraryItem(id, val.trim());
    await renderLibrary();
  };

  const btnDelete = document.createElement("button");
  btnDelete.className = "text-red-600 hover:underline";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = async () => {
    if (!confirm(`Delete “${title}”?`)) return;
    await XSF_DB.deleteLibraryItem(id);
    await renderLibrary();
  };

  actions.append(btnRename, btnDelete);
  body.append(titleEl, sub, actions);
  wrap.append(posterBox, body);
  return wrap;
}

async function renderLibrary() {
  const list = $("library-list");
  const empty = $("library-empty");
  const loading = $("library-loading");

  try {
    loading.classList.remove("hidden");
    empty.classList.add("hidden");
    list.innerHTML = "";

    const items = await XSF_DB.listLibraryItems();

    if (!items || items.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    for (const it of items) {
      list.appendChild(card(it));
    }
  } catch (err) {
    console.error("[library] render error:", err);
    alert(err.message || "Failed to load your library.");
  } finally {
    loading.classList.add("hidden");
  }
}

async function onAdd() {
  const titleEl = $("add-title");
  const posterEl = $("add-poster");
  const yearEl = $("add-year");
  const btn = $("add-btn");

  const title = (titleEl.value || "").trim();
  const poster = (posterEl.value || "").trim();
  const yearStr = (yearEl.value || "").trim();

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
    await XSF_DB.addLibraryItem({ title, poster_url: poster || null, year });
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

function init() {
  $("add-btn")?.addEventListener("click", onAdd);
  renderLibrary();
  supabase.auth.onAuthStateChange(() => renderLibrary());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
