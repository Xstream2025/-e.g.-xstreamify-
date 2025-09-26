// main.js — unified Phase 10 logic

// =====================
// Selectors
// =====================
const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const importBtn = document.getElementById("import-json");
const exportBtn = document.getElementById("export-json");
const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const movieForm = document.getElementById("movieForm");

// =====================
// State
// =====================
let library = JSON.parse(localStorage.getItem("xsf_vault_v10")) || [];
let query = "";
let sort = "recent";
let editingId = null;

// =====================
// Render function
// =====================
function render() {
  grid.innerHTML = "";

  let filtered = library.filter(movie =>
    movie.title.toLowerCase().includes(query.toLowerCase())
  );

  if (sort === "az") filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "za") filtered.sort((a, b) => b.title.localeCompare(a.title));

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach(movie => {
    const card = document.createElement("article");
    card.className = "w-40";
    card.innerHTML = `
      <img src="${movie.poster || ""}" alt="${movie.title}" class="rounded mb-2">
      <p class="text-sm">${movie.title}</p>
    `;
    grid.appendChild(card);
  });
}

// =====================
// Event Listeners
// =====================

// Search
searchInput?.addEventListener("input", e => {
  query = e.target.value;
  render();
});

// Sort
sortSelect?.addEventListener("change", e => {
  sort = e.target.value;
  render();
});

// =====================
// Import JSON
// =====================
importBtn?.addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        library = JSON.parse(evt.target.result);
        localStorage.setItem("xsf_vault_v10", JSON.stringify(library));
        render();
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
});

// =====================
// Export JSON
// =====================
exportBtn?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(library, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `xsf_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// =====================
// Add movie
// =====================
addBtn?.addEventListener("click", () => openModal());

function openModal() {
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  movieForm.reset();
  editingId = null;
}

// Modal Close (click outside)
modal?.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

// Modal Form Submit
movieForm?.addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(movieForm).entries());

  if (editingId !== null) {
    library[editingId] = data;
  } else {
    library.push(data);
  }

  localStorage.setItem("xsf_vault_v10", JSON.stringify(library));
  render();
  closeModal();
});

// =====================
// Initial Render
// =====================
render();
