/* Phase 10 logic — poster rendering without aspect plugin (2:3 via padding), plus favorites */

const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const STORAGE_KEY = 'xsf_library_v1';
const PLACEHOLDER_POSTER = '/img/placeholder-2x3.png';

const state = {
  items: load() ?? seed(),
  favorites: new Set(),
  view: 'featured',
  libFilter: 'all',
  vault: { tab: 'movies', folder: 'all' },
};

deriveFavoritesFromItems();

/* ---------- Startup ---------- */
window.addEventListener('DOMContentLoaded', () => {
  qsa('.nav-btn').forEach(b => b.addEventListener('click', onNav));
  highlightNav('featured');

  qs('#global-search').addEventListener('input', onGlobalSearch);
  qs('#search-clear').addEventListener('click', () => { qs('#global-search').value=''; rerender(); });
  qsa('[data-quick]').forEach(b => b.addEventListener('click', onQuick));

  qsa('.lib-filter').forEach(b => b.addEventListener('click', e => {
    state.libFilter = e.currentTarget.dataset.filter;
    renderLibrary();
  }));

  const form = qs('#add-form');
  form.addEventListener('submit', onAdd);
  qs('#add-reset').addEventListener('click', () => { form.reset(); qs('#add-msg').textContent=''; });

  qsa('.vault-tab').forEach(b => b.addEventListener('click', e => {
    state.vault.tab = e.currentTarget.dataset.vtab;
    renderVault();
  }));
  qsa('[data-vfolder]').forEach(b => b.addEventListener('click', e => {
    state.vault.folder = e.currentTarget.dataset.vfolder;
    renderVault();
  }));

  qs('#btn-export').addEventListener('click', onExport);
  qs('#import-input').addEventListener('change', onImport);

  renderAll();
});

/* ---------- Data ---------- */
function seed(){
  const now = Date.now();
  return [
    {id: gid(), title:'Inception',  poster:'', url:'', fav:false, addedAt:now-5*864e5,  type:'movie'},
    {id: gid(), title:'The Matrix', poster:'', url:'', fav:true,  addedAt:now-3*864e5,  type:'movie'},
    {id: gid(), title:'Blade Runner', poster:'', url:'', fav:false, addedAt:now-2*864e5, type:'movie'},
    {id: gid(), title:'Mad Max: Fury Road', poster:'', url:'', fav:false, addedAt:now-8*864e5, type:'movie'},
    {id: gid(), title:'Braveheart', poster:'', url:'', fav:true,  addedAt:now-12*864e5, type:'movie'},
  ];
}
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr)? arr : null;
  }catch{return null;}
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); }
function deriveFavoritesFromItems(){ state.favorites = new Set(state.items.filter(i=>i.fav).map(i=>i.id)); }

/* ---------- UI helpers ---------- */
function gid(){ return 'id_'+Math.random().toString(36).slice(2,10); }
function toast(msg){
  const el = qs('#toast'); if(!el) return;
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(el._t); el._t = setTimeout(()=>el.classList.add('hidden'),1800);
}
function highlightNav(key){
  qsa('.nav-btn').forEach(b=>{
    const on = b.dataset.nav===key;
    b.classList.toggle('border-red-600', on);
    b.classList.toggle('text-red-400', on);
    b.classList.toggle('border-neutral-700', !on);
  });
}
function showSection(key){
  const map = {
    featured:'#section-featured',
    library :'#section-library',
    how     :'#section-how',
    add     :'#section-add',
    vault   :'#section-vault',
  };
  Object.values(map).forEach(sel=>qs(sel).classList.add('hidden'));
  qs(map[key]).classList.remove('hidden');
  state.view = key;
  highlightNav(key);
}

/* ---------- Poster helper (no aspect plugin) ---------- */
function setPoster(artEl, src, alt){
  // artEl contains a <div class="pt-[150%]"></div> sizer that sets height
  // We absolutely position the <img> over it.
  artEl.querySelector('span')?.remove(); // remove "No Poster" label if present
  const old = artEl.querySelector('img'); if (old) old.remove();

  const img = new Image();
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.alt = alt || 'Poster';
  img.className = 'absolute inset-0 w-full h-full object-cover';
  img.onerror = () => {
    if (src !== PLACEHOLDER_POSTER) {
      setPoster(artEl, PLACEHOLDER_POSTER, alt);
    } else {
      // final fallback: show label again
      artEl.querySelector('.pt-[150%]') || artEl.insertAdjacentHTML('afterbegin','<div class="pt-[150%]"></div>');
      if (!artEl.querySelector('span')) {
        artEl.insertAdjacentHTML('beforeend','<span class="absolute inset-0 grid place-items-center opacity-50 text-xs">No Poster</span>');
      }
    }
  };
  img.src = src;
  artEl.appendChild(img);
}

/* ---------- Renderers ---------- */
function renderAll(){ renderFeatured(); renderLibrary(); renderVault(); }

function makeCard(item){
  const tpl = qs('#card-tpl').content.cloneNode(true);
  const card   = tpl.querySelector('.group');
  const art    = tpl.querySelector('.poster'); // has relative + sizer div
  const title  = tpl.querySelector('.title');
  const favBtn = tpl.querySelector('.fav-btn');

  // Poster
  const src = item.poster && item.poster.trim() ? item.poster.trim() : PLACEHOLDER_POSTER;
  setPoster(art, src, item.title);

  // Title
  title.textContent = item.title;

  // Favorite (♡/❤️)
  favBtn.textContent = item.fav ? '❤️' : '♡';
  favBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    item.fav = !item.fav;
    favBtn.textContent = item.fav ? '❤️' : '♡';
    if(item.fav) state.favorites.add(item.id); else state.favorites.delete(item.id);
    save();
    rerender();
  });

  // Click through
  card.addEventListener('click', ()=>{
    if(item.url) window.open(item.url, '_blank');
  });

  return tpl;
}

function renderFeatured(){
  const grid = qs('#featured-grid'); grid.innerHTML='';
  state.items.slice(0,12).forEach(item=>grid.appendChild(makeCard(item)));
}
function renderLibrary(){
  const grid = qs('#library-grid'); grid.innerHTML='';
  const q = qs('#global-search').value.trim().toLowerCase();
  let items = state.items;
  if(q) items = items.filter(i=>i.title.toLowerCase().includes(q));
  if(state.libFilter==='recent') items = [...items].sort((a,b)=>b.addedAt-a.addedAt).slice(0,24);
  else if(state.libFilter==='fav') items = items.filter(i => i.fav);
  items.forEach(i=>grid.appendChild(makeCard(i)));
}
function renderVault(){
  const grid = qs('#vault-grid'); grid.innerHTML='';
  let items = state.items;
  if(state.vault.folder==='recent') items=[...items].sort((a,b)=>b.addedAt-a.addedAt).slice(0,36);
  else if(state.vault.folder==='favorites') items=items.filter(i=>i.fav);
  qs('#vault-heading').textContent = `Movies / ${capitalize(state.vault.folder)}`;
  qs('#vault-count').textContent = String(items.length);
  items.forEach(i=>grid.appendChild(makeCard(i)));
}
function rerender(){
  if(state.view==='featured') renderFeatured();
  if(state.view==='library')  renderLibrary();
  if(state.view==='vault')    renderVault();
}

/* ---------- Events ---------- */
function onNav(e){
  const key = e.currentTarget.dataset.nav;
  showSection(key);
  if(key==='library') renderLibrary();
  if(key==='vault')   renderVault();
}
function onQuick(e){
  const q = e.currentTarget.dataset.quick;
  showSection('library');
  state.libFilter = (q==='recent') ? 'recent' : (q==='fav' ? 'fav' : 'all');
  renderLibrary();
}
function onGlobalSearch(){
  if(state.view!=='library') showSection('library');
  renderLibrary();
}
function onAdd(e){
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const title  = (fd.get('title')  || '').toString().trim();
  const poster = (fd.get('poster') || '').toString().trim();
  const url    = (fd.get('url')    || '').toString().trim();
  if(!title) return;

  const item = { id:gid(), title, poster, url, fav:false, addedAt:Date.now(), type:'movie' };
  state.items.unshift(item);
  save();
  qs('#add-msg').textContent = `Added “${title}” to your library.`;
  e.currentTarget.reset();
  toast('Movie added');
  renderLibrary();
  renderVault();
  showSection('library');
}
function onExport(){
  const data = JSON.stringify(state.items, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url;
  a.download = `xstreamify-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('JSON exported');
}
function onImport(e){
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(String(reader.result));
      if(!Array.isArray(parsed)) throw new Error('Invalid JSON format');
      state.items = parsed.map(normalizeItem);
      deriveFavoritesFromItems();
      save();
      renderAll();
      toast('JSON imported');
    }catch(err){ console.error(err); toast('Import failed (invalid JSON)'); }
    finally { e.target.value=''; }
  };
  reader.readAsText(file);
}

/* ---------- Utils ---------- */
function normalizeItem(x){
  return {
    id: x.id ?? gid(),
    title: String(x.title ?? 'Untitled'),
    poster: String(x.poster ?? ''),
    url: String(x.url ?? ''),
    fav: Boolean(x.fav),
    addedAt: Number(x.addedAt ?? Date.now()),
    type: x.type ?? 'movie',
  };
}
function capitalize(s){ return s ? s[0].toUpperCase() + s.slice(1) : s; }
