// public/js/db.js
// Phase 13 helpers: Supabase client + simple profile & library CRUD

const SUPABASE_URL  = window.__SUPABASE_URL__;
const SUPABASE_ANON = window.__SUPABASE_ANON__;
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error("Supabase keys missing. Make sure keys.js sets window.__SUPABASE_* values.");
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/** Session helpers */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}
export async function getUser() {
  const s = await getSession();
  return s?.user || null;
}

/** PROFILE */
export async function fetchProfile() {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") { // not found
    console.error(error);
    throw error;
  }
  return data || null;
}

export async function upsertMyProfile({ display_name, avatar_url } = {}) {
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  const payload = {
    id: user.id,
    display_name: display_name ?? null,
    avatar_url: avatar_url ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("profiles").upsert(payload).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

/** LIBRARY (minimal API) */
export async function addLibraryItem({ title, meta = {} }) {
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  const row = { user_id: user.id, title, meta, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("library_items").insert(row).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function listLibraryItems() {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); throw error; }
  return data || [];
}

export async function updateLibraryItem(id, patch) {
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("library_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function deleteLibraryItem(id) {
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("library_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) { console.error(error); throw error; }
  return true;
}

// Optional: simple debug hook in console
window.XSF_DB = { getSession, getUser, fetchProfile, upsertMyProfile, addLibraryItem, listLibraryItems, updateLibraryItem, deleteLibraryItem };
console.info("XSF_DB ready: try XSF_DB.getUser() in the console.");
