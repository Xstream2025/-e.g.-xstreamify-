// public/js/db.js
// Simple persistent DB using localStorage.
// Key: 'xsf_library_v1'

(function () {
  const KEY = "xsf_library_v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function save(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (err) {
      console.error("[DB] save failed:", err);
    }
  }

  const DB = {
    async add(item) {
      const all = load();
      all.push({ ...item, _ts: Date.now() });
      save(all);
      console.log("[DB] add:", item);
      return true;
    },

    async getAll() {
      const all = load();
      console.log("[DB] getAll ->", all.length, "items");
      return all;
    },

    async clear() {
      save([]);
      console.log("[DB] cleared");
      return true;
    }
  };

  // expose both styles for compatibility
  window.DB = DB;
  window.db = DB;
})();
