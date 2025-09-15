// db.js — Supabase client + reusable helpers (profiles, library)

if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON__) {
  console.error("Missing Supabase keys. Set them in public/js/keys.js");
}

export const supabase = window.supabase.createClient(
  window.__SUPABASE_URL__,
  window.__SUPABASE_ANON__,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const XSF_DB = {
  // ---------- Auth ----------
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("getUser error:", error);
      return null;
    }
    return data.user ?? null;
  },
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await XSF_DB.ensureProfile();
    return data.user;
  },
  async signUp({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/signin.html#reset`,
    });
    if (error) throw error;
    return data;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  // ---------- Profiles ----------
  async ensureProfile() {
    const user = await XSF_DB.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.warn("ensureProfile select error:", error);
      return;
    }
    if (!data) {
      const { error: insErr } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email || null,
        display_name: null,
        avatar_url: null,
      });
      if (insErr) console.warn("ensureProfile insert error:", insErr);
    }
  },
  async getProfile() {
    const user = await XSF_DB.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,avatar_url")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data;
  },
  async updateProfile(partial) {
    const user = await XSF_DB.getUser();
    if (!user) throw new Error("No user");
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...partial })
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- Library (CRUD) ----------
  async listLibraryItems() {
    const { data, error } = await supabase
      .from("library_items")
      .select("id,title,poster_url,year,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async addLibraryItem({ title, poster_url = null, year = null }) {
    const { data, error } = await supabase
      .from("library_items")
      .insert([{ title, poster_url, year }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async renameLibraryItem(id, newTitle) {
    const { data, error } = await supabase
      .from("library_items")
      .update({ title: newTitle })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteLibraryItem(id) {
    const { error } = await supabase
      .from("library_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};

// Expose for console diagnostics (optional)
window.XSF_DB = XSF_DB;
export default XSF_DB;
