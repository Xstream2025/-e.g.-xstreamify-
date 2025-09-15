// library-adapter.js — minimal Library UI + CRUD wiring
import { XSF_DB, supabase } from "./db.js";

const grid = document.querySelector("#library-grid");
const form = document.querySelector("#add-form");
const titleIn = document.querySelector("#add-title");
const posterIn = document.querySelector("#add-poster");
const yearIn = document.querySelector("#add-year");
const emptyState = document.querySelector("#empty-state");

function cardTemplate(item) {
  const poster = item.poster_url || "https://placehold.co/300x450?text=No+Poster";
  const year = item.year ? `(${item.year})` : "";
  return `
    <div class="rounded-2xl shadow p-3 bg-white flex flex-col gap-3" data-id="${item.id}">
      <img src="${poster}" alt="${item.title}" class="w-full aspect-[2/3] object-cover rounded-xl" />
      <div class="flex items-center justify-between">
        <div class="font-semibold">${item.title} <span class="text-gray-500 text-sm">${year}</span></div>
        <div class="flex gap-2">
          <button class="rename-btn border rounded-xl px-2 py-1 text-sm">Rename</button>
          <button class="delete-btn border rounded-xl px-2 py-1 text-sm">Delete</button>
        </div>
      </div>
    </div>
  `;
}

async function renderLibrary() {
  const user = await XSF_DB.getUser();
  if (!user) {
    location.href = "./signin.html";
    return;
  }
  const items = await XSF_DB.listLibraryItems();
  if (!items.length) {
    emptyState.classList.remove("hidden");
    grid.innerHTML = "";
    return;
  }
  emptyState.classList.add("hidden");
  grid.innerHTML = items.map(cardTemplate).join("");

  grid.querySelectorAll(".rename-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.currentTarget.closest("[data-id]");
      const id = card.getAttribute("data-id");
      const current = card.querySelector(".font-semibold").childNodes[0].nodeValue.trim();
      const newTitle = prompt("New title:", current);
      if (!newTitle) return;
      try {
        await XSF_DB.renameLibraryItem(id, newTitle);
        await renderLibrary();
      } catch (err) {
        console.error(err);
        alert("Rename failed");
      }
    });
  });

  grid.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.currentTarget.closest("[data-id]");
      const id = card.getAttribute("data-id");
      if (!confirm("Delete this item?")) return;
      try {
        await XSF_DB.deleteLibraryItem(id);
        await renderLibrary();
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    });
  });
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const addBtn = form.querySelector("button[type=submit]");
  addBtn.disabled = true;
  addBtn.textContent = "Adding…";
  try {
    const title = titleIn.value.trim();
    if (!title) throw new Error("Title required");
    const poster_url = posterIn.value.trim() || null;
    const year = yearIn.value ? Number(yearIn.value) : null;

    const user = await XSF_DB.getUser();
    if (!user) throw new Error("Please sign in");

    await XSF_DB.addLibraryItem({ title, poster_url, year });
    form.reset();
    await renderLibrary();
  } catch (err) {
    console.error(err);
    alert(err.message || "Add failed");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add to Library";
  }
});

// Optional: auto-refresh library when auth changes
supabase.auth.onAuthStateChange((_evt, session) => {
  if (session?.user) renderLibrary();
});

renderLibrary();

// console helpers
window.__dump = async () => console.log(await XSF_DB.listLibraryItems());
