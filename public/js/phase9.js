/* X-Streamify – Phase 9 safe script
   - Vault key normalizer (runs once)
   - Null-safe event wiring (no $)
   - Render from localStorage 'xsf_vault_v10'
   - Export / Import JSON
*/
(() => {
  // ---------- Vault Key Normalizer (before state/UI) ----------
  (function normalizeKeys() {
    const PREFERRED = 'xsf_vault_v10';
    const FALLBACKS = ['xsf_vault_v9', 'xsf_vault_v1', 'xsf_movies', 'movies', 'vault'];

    const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

    const v10Raw = localStorage.getItem(PREFERRED);
    const v10 = parse(v10Raw);
    if (Array.isArray(v10)) return;

    for (const k of FALLBACKS) {
      const raw = localStorage.getItem(k);
      const parsed = parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        localStorage.setItem(PREFERRED, JSON.stringify(parsed));
        break;
      }
    }
  })();

  // ---------- Helpers ----------
  const PRIMARY_KEY = 'xsf_vault_v10';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const parse = (s, fallback = []) => { try { return JSON.parse(s ?? ''); } catch { return fallback; } };
  const getVault = () => parse(localStorage.getItem(PRIMARY_KEY), []);
  const setVault = (arr) => localStorage.setItem(PRIMARY_KEY, JSON.stringify(arr ?? []));

  // ---------- Elements (may not exist – that’s fine) ----------
  const els = {
    grid: $('#grid'),
    empty: $('#emptyState'),
    search: $('#search'),
    sort: $('#sort'),

    // optional buttons/controls your page may or may not have
    addBtn: $('#addBtn'),
    addBtn2: $('#addBtn2'),
    modal: $('#modal'),
    movieForm: $('#movieForm'),

    exportBtn: $('#export-json') || $('#btnExport') || $$('button,a').find(el => /export\s*json/i.test((el.textContent || '').trim())),
    importFile: $('#import-json') || $('#fileImport'),
  };

  // ---------- Render ----------
  function render() {
    const movies = getVault();

    if (!els.grid) return;           // page has no grid (nothing to do)
    if (!movies.length) {
      els.grid.innerHTML = '';
      els.empty && els.empty.classList.remove('hidden');
      return;
    }

    els.empty && els.empty.classList.add('hidden');

    // simple sort if you have a <select id="sort">
    let items = movies.slice();
    const sort = els.sort?.value || 'recent';
    if (sort === 'az') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sort === 'za') {
      items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else {
      items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }

    // simple search if you have <input id="search">
    const q = (els.search?.value || '').trim().toLowerCase();
    if (q) items = items.filter(m => (m.title || '').toLowerCase().includes(q));

    els.grid.innerHTML = items.map(m => `
      <article class="p-3">
        <div class="rounded-2xl overflow-hidden">
          <img src="${m.poster}" alt="${m.title}" class="block w-full" />
        </div>
        <h3 class="card-title mt-2">${m.title}</h3>
      </article>
    `).join('');
  }

  // ---------- Safe listeners (all null-safe) ----------
  els.search?.addEventListener('input', () => render());
  els.sort?.addEventListener('change', () => render());

  // Optional “Add” modal wiring (only if these exist on your page)
  els.addBtn?.addEventListener('click', () => openModal('add'));
  if (typeof els.addBtn2 !== 'undefined' && els.addBtn2) {
    els.addBtn2.addEventListener('click', () => openModal('add'));
  }
  els.modal?.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
  els.movieForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(els.movieForm).entries());
    // You can hook your own add/update here; for safety we just add with an id
    const list = getVault();
    const id = data.id || (data.title ? data.title.toLowerCase().replace(/\s+/g,'-') : String(Date.now()));
    const idx = list.findIndex(x => x.id === id);
    const item = { id, title: data.title || 'Untitled', poster: data.poster || '', addedAt: Date.now() };
    if (idx >= 0) list[idx] = item; else list.push(item);
    setVault(list);
    render();
    closeModal();
  });

  // Stubs so the optional calls above don’t throw if you don’t have them implemented
  function openModal() { els.modal && els.modal.classList.remove('hidden'); }
  function closeModal() { els.modal && els.modal.classList.add('hidden'); }

  // ---------- Export (no $ and no double listeners) ----------
  (function wireExport() {
    if (!els.exportBtn) return;
    const clone = els.exportBtn.cloneNode(true);
    els.exportBtn.replaceWith(clone);
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const data = getVault();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `xsf_vault_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } catch (err) {
        console.error(err);
        alert('Export failed');
      }
    });
  })();

  // ---------- Import (file input change) ----------
  els.importFile?.addEventListener('change', (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        if (!confirm('Import this library? This will replace your current list.')) return;
        localStorage.setItem(PRIMARY_KEY, JSON.stringify(parsed));
        alert(`Imported ${parsed.length} items`);
        location.reload();
      } catch (err) {
        console.error(err);
        alert('Import failed: Invalid format');
      }
    };
    reader.readAsText(file);
    // clear the input so the same file can be selected again later
    e.target.value = '';
  });

  // ---------- Initial render ----------
  render();
})();
