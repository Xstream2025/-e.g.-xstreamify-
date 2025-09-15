import { XSF_DB } from "./js/db.js";

const titleInput = document.getElementById("add-title");
const posterInput = document.getElementById("add-poster");
const yearInput = document.getElementById("add-year");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("library-list");
const empty = document.getElementById("library-empty");
const loading = document.getElementById("library-loading");

async function refreshLibrary() {
  list.innerHTML = "";
  empty.style.display = "none";
  loading.style.display = "block";

  try {
    const items = await XSF_DB.getLibrary();
    loading.style.display = "none";

    if (!items || items.length === 0) {
      empty.style.display = "block";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "movie-card";

      const poster = document.createElement("img");
      poster.src = item.poster_url || "./img/placeholder-2x3.png";
      poster.alt = item.title;

      const title = document.createElement("h3");
      title.textContent = item.title;

      const year = document.createElement("p");
      year.textContent = item.year ? `Year: ${item.year}` : "";

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.onclick = async () => {
        await XSF_DB.deleteLibraryItem(item.id);
        refreshLibrary();
      };

      card.appendChild(poster);
      card.appendChild(title);
      card.appendChild(year);
      card.appendChild(del);

      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    loading.textContent = "Error loading library.";
  }
}

addBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  if (!title) return;

  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    await XSF_DB.addLibraryItem({
      title,
      poster_url: posterInput.value.trim(),
      year: yearInput.value.trim(),
    });

    titleInput.value = "";
    posterInput.value = "";
    yearInput.value = "";

    await refreshLibrary();
  } catch (err) {
    console.error(err);
    alert("Error adding movie: " + err.message);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add to Library";
  }
});

refreshLibrary();
