(() => {
  // -------- constants
  const TMDB = "https://image.tmdb.org/t/p/w500";
  const KEY  = "xsf.library";
  const ADMIN_KEY = "xsf.admin";

  // inline SVG fallback (clean: no “svg+xml…” network spam)
  const FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#111827"/>
            <stop offset="1" stop-color="#0b1324"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <g fill="#9ca3af" font-family="system-ui,Segoe UI,Roboto" font-size="26" text-anchor="middle">
          <text x="200" y="290">No Poster</text>
        </g>
      </svg>
    `);

  // -------- helpers
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const by = (k, dir = -1) => (a, b) => (a[k] > b[k] ? dir : a[k] < b[k] ? -dir : 0);

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m])
    );
  }

  // -------- state
  let movies = [];
  let filterMode = "all"; // all | recent | fav
  let searchStr  = "";

  // -------- UI refs
  const grid         = qs('#grid');
  const searchInput  = qs('#searchInput');
  const pillAll      = qs('#pillAll');
  const pillRecent   = qs('#pillRecent');
  const pillFav      = qs('#pillFav');
  const countEl      = qs('#count');
  const adminBtns    = qs('#adminBtns');
  const filePicker   = qs('#filePicker');
  const btnImport    = qs('#btnImport');
  const btnExport    = qs('#btnExport');
  const btnClear     = qs('#btnClear');

  // -------- defaults (12 sample)
  function defaultLibrary() {
    const now = Date.now();
    const mk = (id, title, year, poster, offset) => ({
      id, title, year, poster, favorite: false, addedAt: now - offset
    });
    return [
      mk('m1','The Dark Knight', 2008, '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 11e6),
      mk('m2','Avatar (Picture)',2009, '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', 10e6),
      mk('m3','Interstellar',    2014, '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 9e6),
      mk('m4','Braveheart',      1995, '/or1gBugydmjToAEq7OZY0owwFk.jpg',  8e6),
      mk('m5','Gladiator',       2000, '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg', 7e6),
      mk('m6','Inception',       2010, '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', 6e6),
      mk('m7','The Matrix',      1999, '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 5e6),
      mk('m8','Blade Runner 2049',2017,'/aMpyrCizvS3cD7PZpXo8d9C6bYv.jpg', 4e6),
      mk('m9','Pulp Fiction',    1994, '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 3e6),
      mk('m10','The Godfather',  1972, '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 2e6),
      mk('m11','The Shawshank Redemption',1994, '/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg', 1.5e6),
      mk('m12','The Lord of the Rings: The Fellowship of the Ring',2001,'/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 1e6),
    ];
  }

  // -------- storage
  function loadLibrary() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : defaultLibrary();
      // ensure fields
      for (const m of list) {
        if (m.addedAt == null) m.addedAt = Date.now();
        if (m.favorite == null) m.favorite = false;
      }
      return list;
    } catch {
      return defaultLibrary();
    }
  }
  function saveLibrary() {
    localStorage.setItem(KEY, JSON.stringify(movies));
  }

  // -------- poster helpers
  function posterUrl(m) {
    if (!m || !m.poster) return FALLBACK_SVG;
    return m.poster.startsWith('http') ? m.poster : `${TMDB}${m.poster}`;
  }

  // -------- render
  function card(m) {
    const favClass = m.favorite ? ' fav' : '';
    return `
      <article class="card relative">
        <img class="poster block w-full" alt="${escapeHtml(m.title)}"
             src="${FALLBACK_SVG}" data-src="${posterUrl(m)}" />
        <button class="star${favClass}" data-id="${m.id}" title="Favorite">★</button>
        <div class="px-3 py-2 border-t border-white/5">
          <div class="line-clamp-2 text-sm">${escapeHtml(m.title)}</div>
          <div class="text-xs text-neutral-400">${m.year ?? ''}</div>
        </div>
      </article>
    `;
  }

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    searchStr = q;

    let list = movies.filter(m =>
      m.title.toLowerCase().includes(q)
    );

    if (filterMode === 'fav') {
      list = list.filter(m => m.favorite);
    } else if (filterMode === 'recent') {
      list = [...list].sort(by('addedAt', -1));
    } else {
      list = [...list].sort(by('title', 1));
    }

    grid.innerHTML = list.map(card).join('');
    countEl.textContent = String(list.length);

    wireCardHandlers();
    lazyLoadImages();
  }

  function setActive(btn) {
    [pillAll, pillRecent, pillFav].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // -------- events
  function wirePills() {
    pillAll.addEventListener('click', () => {
      filterMode = 'all'; setActive(pillAll); applyFilters();
    });
    pillRecent.addEventListener('click', () => {
      filterMode = 'recent'; setActive(pillRecent); applyFilters();
    });
    pillFav.addEventListener('click', () => {
      filterMode = 'fav'; setActive(pillFav); applyFilters();
    });
  }

  function wireSearch() {
    searchInput.addEventListener('input', () => applyFilters());
  }

  function wireCardHandlers() {
    qsa('.star', grid).forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const m = movies.find(x => x.id === id);
        if (!m) return;
        m.favorite = !m.favorite;
        saveLibrary();
        // toggle class immediately
        btn.classList.toggle('fav', m.favorite);
        // if in favorites filter, re-render to hide non-favs
        if (filterMode === 'fav') applyFilters();
      };
    });
  }

  // -------- lazy images with fallback
  function lazyLoadImages() {
    const imgs = qsa('img.poster[data-src]', grid);
    if (!imgs.length) return;

    const load = (img) => {
      const url = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.src = url || FALLBACK_SVG;
    };

    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          load(e.target);
          obs.unobserve(e.target);
        }
      }
    }, { rootMargin: '150px' });

    imgs.forEach(img => {
      img.onerror = () => { img.src = FALLBACK_SVG; };
      io.observe(img);
    });
  }

  // -------- admin (import/export/clear)
  function wireAdmin() {
    const url = new URL(location.href);
    if (url.searchParams.get('admin') === '1') {
      localStorage.setItem(ADMIN_KEY, '1');
    } else if (url.searchParams.get('admin') === '0') {
      localStorage.removeItem(ADMIN_KEY);
    }

    const isAdmin = localStorage.getItem(ADMIN_KEY) === '1';
    adminBtns.classList.toggle('hidden', !isAdmin);
    if (!isAdmin) return;

    btnImport.onclick = () => filePicker.click();

    filePicker.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || '[]'));
          if (!Array.isArray(data)) throw new Error('Invalid file');
          movies = data;
          saveLibrary();
          applyFilters();
        } catch (err) {
          alert('Import failed: ' + err.message);
        }
      };
      reader.readAsText(file);
      filePicker.value = '';
    };

    btnExport.onclick = () => {
      const blob = new Blob([JSON.stringify(movies, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'xstreamify-library.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    btnClear.onclick = () => {
      if (!confirm('Clear your local library?')) return;
      localStorage.removeItem(KEY);
      movies = [];
      applyFilters();
    };
  }

  // -------- boot
  function init() {
    movies = loadLibrary();
    wirePills();
    wireSearch();
    wireAdmin();
    applyFilters();
  }

  init();
})();
