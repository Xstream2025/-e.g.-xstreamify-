// public/js/profiles.js
// X-Streamify — Profiles (Option B): droplet bounce + plop/boing sounds
// Persists avatars + active profile in localStorage

const LS_PROFILES = "xsf_profiles_v1";
const LS_ACTIVE   = "xsf_active_profile_v1";

const DEFAULT_PROFILES = [
  { id: "hector",  name: "Hector",  avatar: null },
  { id: "emma",    name: "Emma",    avatar: null },
  { id: "jordan",  name: "Jordan",  avatar: null },
  { id: "allison", name: "Allison", avatar: null },
];

// ---------- Tiny synth sounds (no audio files) ----------
let audioCtx;
function ensureCtx(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function plop(vol=0.2, start=650, end=200, ms=160){
  ensureCtx();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(start, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(end, audioCtx.currentTime + ms/1000);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms/1000);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + ms/1000);
}
function boing(vol=0.15, base=220, ms=220){
  ensureCtx();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(base, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(base*1.8, audioCtx.currentTime + ms/2000);
  o.frequency.exponentialRampToValueAtTime(base*0.9, audioCtx.currentTime + ms/1000);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms/1000);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + ms/800);
}

// ---------- Storage helpers ----------
function loadProfiles(){
  const raw = localStorage.getItem(LS_PROFILES);
  if(!raw) return DEFAULT_PROFILES.slice();
  try {
    const saved = JSON.parse(raw);
    return DEFAULT_PROFILES.map(d => ({...d, ...(saved.find(s=>s.id===d.id)||{})}));
  } catch { return DEFAULT_PROFILES.slice(); }
}
function saveProfiles(list){ localStorage.setItem(LS_PROFILES, JSON.stringify(list)); }
function getActive(){ return localStorage.getItem(LS_ACTIVE); }
function setActive(id){ localStorage.setItem(LS_ACTIVE, id); }

// ---------- DOM refs ----------
const overlay   = document.getElementById("profileOverlay");
const grid      = document.getElementById("profileGrid");
const dock      = document.getElementById("profileDock");
const switchBtn = document.getElementById("switchProfileBtn");

let profiles = loadProfiles();

// ---------- Renderers ----------
function renderGrid(){
  if(!grid) return;
  grid.innerHTML = "";
  profiles.forEach(p=>{
    const tile = document.createElement("div");
    tile.className = "profile-tile optionB";
    tile.dataset.id = p.id;
    tile.innerHTML = `
      <div class="avatar ${p.avatar?'has-img':''}" style="${p.avatar?`background-image:url('${p.avatar}')`:''}"></div>
      <div class="name">${p.name}</div>
      <button class="upload">Edit</button>
      <input type="file" class="uploader" accept="image/*" hidden>
    `;

    // avatar edit
    tile.querySelector(".upload").addEventListener("click", ()=>{
      tile.querySelector(".uploader").click();
    });
    tile.querySelector(".uploader").addEventListener("change", (e)=>{
      const f = e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        p.avatar = reader.result;
        saveProfiles(profiles);
        renderGrid();
        renderDock(getActive());
      };
      reader.readAsDataURL(f);
    });

    // select profile
    tile.addEventListener("click", (ev)=>{
      if (ev.target.closest(".upload")) return; // ignore clicks on Edit
      selectProfile(tile, p.id);
    });

    grid.appendChild(tile);
  });
}

// Dock now shows ONLY the active profile (single circle). Hidden until selected.
function renderDock(activeId){
  if(!dock) return;
  dock.innerHTML = "";
  if(!activeId){
    dock.classList.add("hidden");
    return;
  }
  dock.classList.remove("hidden");
  const p = profiles.find(x => x.id === activeId) || { name: "Active" };
  const dot = document.createElement("button");
  dot.className = "dock-dot active";
  dot.style.backgroundImage = p.avatar ? `url('${p.avatar}')` : "none";
  dot.title = p.name;
  // Click the circle to reopen chooser (for switching)
  dot.addEventListener("click", ()=>{
    if(overlay){
      overlay.classList.remove("hidden");
      document.body.classList.add("no-scroll");
    }
  });
  dock.appendChild(dot);
}

function showOverlayIfNeeded(){
  const act = getActive();
  if (!act && overlay){
    overlay.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }
  renderDock(act);
}

// ---------- Selection animation ----------
function selectProfile(tile, id){
  if(!dock) return;

  plop(); // initial select sound

  const rect = tile.getBoundingClientRect();
  const dockRect = dock.getBoundingClientRect();
  const targetX = dockRect.left + dockRect.width/2;
  const targetY = dockRect.top  + dockRect.height/2;
  const startX  = rect.left + rect.width/2;
  const startY  = rect.top  + rect.height/2;
  const dx = targetX - startX;
  const dy = targetY - startY;

  const ghost = tile.cloneNode(true);
  const s = ghost.style;
  s.position = "fixed";
  s.left = rect.left + "px";
  s.top  = rect.top  + "px";
  s.width  = rect.width + "px";
  s.height = rect.height + "px";
  s.zIndex = 9999;
  document.body.appendChild(ghost);

  tile.classList.add("dimmed");

  const timing = { duration: 900, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" };
  ghost.animate([
    { transform: "translate(0,0) scale(1)", borderRadius: "16px 16px 9999px 9999px" },
    { offset: .45, transform: `translate(${dx*0.75}px, ${dy*0.6}px) scale(0.98)`, borderRadius: "24px 24px 9999px 9999px" },
    { offset: .7,  transform: `translate(${dx*0.35}px, ${dy*0.82}px) scale(1.02)` },
    { transform: `translate(${dx}px, ${dy}px) scale(1)`, borderRadius: "9999px" }
  ], timing).addEventListener("finish", ()=>{
    ghost.remove();
    setActive(id);
    renderDock(id); // shows the single circle
    if(overlay){ overlay.classList.add("hidden"); document.body.classList.remove("no-scroll"); }
  });

  setTimeout(()=>boing(), 320);
  setTimeout(()=>boing(), 610);
}

// ---------- Re-open chooser via button ----------
if (switchBtn){
  switchBtn.addEventListener("click", ()=>{
    if(overlay){
      overlay.classList.remove("hidden");
      document.body.classList.add("no-scroll");
    }
  });
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", ()=>{
  renderGrid();
  showOverlayIfNeeded();
});
