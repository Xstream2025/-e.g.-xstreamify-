// public/js/profiles.js
// Profiles with background removal (compact WebP) + Reset (sounds always ON)

import { createCutoutFromImage, downscaleImageToDataURL } from "./segmentation.js";
import { playPlop, playBoing } from "./sound.js";

const LS_PROFILES = "xsf_profiles_v1";
const LS_ACTIVE   = "xsf_active_profile_v1";

const DEFAULT_PROFILES = [
  { id: "hector",  name: "Hector",  avatarOrig: null, avatarCut: null },
  { id: "emma",    name: "Emma",    avatarOrig: null, avatarCut: null },
  { id: "jordan",  name: "Jordan",  avatarOrig: null, avatarCut: null },
  { id: "allison", name: "Allison", avatarOrig: null, avatarCut: null },
];

// ---- storage ----
function loadProfiles(){
  const raw = localStorage.getItem(LS_PROFILES);
  if(!raw) return DEFAULT_PROFILES.slice();
  try {
    const saved = JSON.parse(raw);
    return DEFAULT_PROFILES.map(d => ({...d, ...(saved.find(s=>s.id===d.id)||{})}));
  } catch { return DEFAULT_PROFILES.slice(); }
}
function saveProfiles(list){
  try {
    localStorage.setItem(LS_PROFILES, JSON.stringify(list));
  } catch {
    // free space: drop originals if needed (cutouts are compact)
    list.forEach(p => { p.avatarOrig = null; });
    localStorage.setItem(LS_PROFILES, JSON.stringify(list));
  }
}
function getActive(){ return localStorage.getItem(LS_ACTIVE); }
function setActive(id){ localStorage.setItem(LS_ACTIVE, id); }

// ---- DOM ----
const overlay   = document.getElementById("profileOverlay");
const grid      = document.getElementById("profileGrid");
const dock      = document.getElementById("profileDock");
const switchBtn = document.getElementById("switchProfileBtn");
const resetBtn  = document.getElementById("resetProfilesBtn");

let profiles = loadProfiles();

// ---- render ----
function renderGrid(){
  if(!grid) return;
  grid.innerHTML = "";
  profiles.forEach(p=>{
    const hasCut = !!p.avatarCut;
    const tile = document.createElement("div");
    tile.className = `profile-tile optionB ${hasCut ? "" : "empty"}`;
    tile.dataset.id = p.id;

    const cutSrc = hasCut ? p.avatarCut : (p.avatarOrig || "");
    tile.innerHTML = `
      <div class="avatar ${hasCut?'has-cut':''}">
        <div class="bg dvd"></div>
        <img class="cut" alt="${p.name}" ${cutSrc ? `src="${cutSrc}"` : ""} draggable="false"/>
      </div>
      <div class="name">${p.name}</div>

      <button class="upload" aria-label="Edit avatar" title="Edit avatar">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"/>
        </svg>
      </button>
      <input type="file" class="uploader" accept="image/*" hidden>
    `;

    // upload flow
    tile.querySelector(".upload").addEventListener("click", (ev)=>{
      ev.stopPropagation();
      tile.querySelector(".uploader").click();
    });
    tile.querySelector(".uploader").addEventListener("change", async (e)=>{
      const f = e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.onload = async () => {
          const compactOrig = downscaleImageToDataURL(img, 384);
          const cut = (await createCutoutFromImage(img, 384)) || compactOrig;
          p.avatarOrig = compactOrig;
          p.avatarCut  = cut;
          saveProfiles(profiles);
          renderGrid();
          renderDock(getActive());
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    });

    // choose
    tile.addEventListener("click", (ev)=>{
      if (ev.target.closest(".upload")) return;
      selectProfile(tile, p.id);
    });

    grid.appendChild(tile);
  });
}

function renderDock(activeId){
  if(!dock) return;
  dock.innerHTML = "";
  if(!activeId){ dock.classList.add("hidden"); return; }
  dock.classList.remove("hidden");
  const p = profiles.find(x => x.id === activeId) || { name: "Active" };
  const src = p.avatarCut || p.avatarOrig || "";
  const dot = document.createElement("button");
  dot.className = "dock-dot active";
  dot.style.backgroundImage = src ? `url('${src}')` : "none";
  dot.title = p.name;
  dot.addEventListener("click", ()=>{
    overlay?.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  });
  dock.appendChild(dot);
}

function showOverlayIfNeeded(){
  const act = getActive();
  if (!act){ overlay?.classList.remove("hidden"); document.body.classList.add("no-scroll"); }
  renderDock(act);
}

// ---- selection animation (with sounds) ----
function selectProfile(tile, id){
  if(!dock) return;
  playPlop();

  const rect = tile.getBoundingClientRect();
  const dockRect = dock.getBoundingClientRect();
  const targetX = dockRect.left + dockRect.width/2;
  const targetY = dockRect.top  + dockRect.height/2;
  const startX  = rect.left + rect.width/2;
  const startY  = rect.top  + rect.height/2;
  const dx = targetX - startX, dy = targetY - startY;

  const ghost = tile.cloneNode(true);
  const s = ghost.style;
  s.position="fixed"; s.left=rect.left+"px"; s.top=rect.top+"px";
  s.width=rect.width+"px"; s.height=rect.height+"px"; s.zIndex=9999;
  document.body.appendChild(ghost);
  tile.classList.add("dimmed");

  const timing = { duration: 900, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" };
  ghost.animate([
    { transform:"translate(0,0) scale(1)", borderRadius:"16px 16px 9999px 9999px" },
    { offset:.45, transform:`translate(${dx*0.75}px, ${dy*0.6}px) scale(0.98)`, borderRadius:"24px 24px 9999px 9999px" },
    { offset:.7,  transform:`translate(${dx*0.35}px, ${dy*0.82}px) scale(1.02)` },
    { transform:`translate(${dx}px, ${dy}px) scale(1)`, borderRadius:"9999px" }
  ], timing).addEventListener("finish", ()=>{
    ghost.remove();
    setActive(id);
    renderDock(id);
    overlay?.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  });

  setTimeout(()=>playBoing(),320);
  setTimeout(()=>playBoing(),610);
}

// ---- quick actions ----
switchBtn?.addEventListener("click", ()=>{
  overlay?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
});

resetBtn?.addEventListener("click", ()=>{
  localStorage.removeItem(LS_PROFILES);
  localStorage.removeItem(LS_ACTIVE);
  profiles = loadProfiles();
  renderGrid();
  renderDock(null);
  overlay?.classList.remove("hidden");
  document.body.classList.add("no-scroll");
});

document.addEventListener("DOMContentLoaded", ()=>{
  renderGrid();
  showOverlayIfNeeded();
});
