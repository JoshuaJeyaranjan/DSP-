import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import "./AdminPage.scss";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

const supabase = createClient(PROJECT_URL, ANON_KEY);
const SIZES = ["small", "medium", "large"];
const FORMATS = ["avif", "webp", "jpg", "jpeg"];
const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];
const HERO_COLUMN_FOR_TYPE = {
  home: "is_home_hero",
  photo: "is_photo_hero",
  video: "is_video_hero",
};

function makeUniqueName(name) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const dot = name.lastIndexOf(".");
  const base = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? "" : name.slice(dot);
  const clean = base.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
  return `${ts}-${rand}-${clean}${ext}`;
}

export default function AdminPage() {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const login = async () => {
      setLoadingAuth(true);
      try {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        if (authErr) throw authErr;
        await loadImagesAndDerived();
      } catch (err) {
        console.error("Admin login failed:", err);
        setError("Admin login failed — check env vars.");
      } finally {
        setLoadingAuth(false);
      }
    };
    login();
  }, []);

  const updateJob = (id, patch) => {
    setJobs(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return [...prev, { id, ...patch }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const getAccessToken = async () => {
    try {
      const s = await supabase.auth.getSession();
      return s?.data?.session?.access_token ?? null;
    } catch {
      return supabase.auth?.session?.()?.access_token ?? null;
    }
  };

  const loadImagesAndDerived = async () => {
    setError(null);
    try {
      const { data: dbRows, error: dbErr } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbErr) console.warn("images table read error:", dbErr);
      if (!dbRows) return setJobs([]);

      const jobsMapped = [];

      for (const row of dbRows) {
        let derived = [];
        if (row.bucket === "photos-derived") {
          const { data: pub } = supabase.storage.from("photos-derived").getPublicUrl(row.path);
          if (pub?.publicUrl) derived.push({ path: row.path, publicUrl: pub.publicUrl });
        } else {
          // Try to get medium preview
          const base = row.path.replace(/\.[^/.]+$/, "");
          for (const size of SIZES) {
            for (const fmt of FORMATS) {
              const key = `${size}/${base}.${fmt}`;
              const { data: pub } = supabase.storage.from("photos-derived").getPublicUrl(key);
              if (pub?.publicUrl) derived.push({ path: key, publicUrl: pub.publicUrl });
            }
          }
        }

        jobsMapped.push({
          id: row.path,
          name: row.title || row.path,
          status: derived.length ? "done" : "missing-derived",
          derived,
          dbRow: row,
          error: null,
        });
      }

      setJobs(jobsMapped);
    } catch (err) {
      console.error("loadImagesAndDerived error:", err);
      setError("Failed to load images or derived files");
    }
  };

  // Upload handling (same as before)
  const handleFilesChange = e => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const prepared = selected.map(f => ({ file: f, id: makeUniqueName(f.name) }));
    setFiles(prev => {
      const existingNames = new Set(prev.map(p => p.file.name));
      return [...prev, ...prepared.filter(p => !existingNames.has(p.file.name))];
    });

    setJobs(prev => {
      const existingNames = new Set(prev.map(j => j.name));
      return [
        ...prev,
        ...prepared
          .filter(p => !existingNames.has(p.file.name))
          .map(p => ({ id: p.id, name: p.file.name, status: "pending", derived: [], dbRow: null, error: null })),
      ];
    });

    setError(null);
  };

  const handleUploadAll = async () => {
    if (!files.length) return;
    setIsUploading(true);

    for (const fObj of files) {
      const { file, id } = fObj;
      updateJob(id, { status: "uploading", error: null });

      try {
        const { error: uploadErr } = await supabase.storage.from("photos-original").upload(id, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        updateJob(id, { status: "uploaded" });

        // Generate thumbnails
        updateJob(id, { status: "generating" });
        const token = await getAccessToken();
        const resp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ bucket: "photos-original", file: id, category }),
        });
        const result = await resp.json();
        if (!resp.ok || !result?.ok) throw new Error(result?.error || `Thumbnail service failed`);

        const generated = Array.isArray(result.generated) ? result.generated : [];
        const derivedRows = [];

        for (const gen of generated) {
          const genPath = typeof gen === "string" ? gen : gen?.path ?? gen?.name;
          if (!genPath) continue;
          const { data: existing } = await supabase.from("images").select("id").eq("path", genPath).limit(1).maybeSingle();
          if (!existing) {
            const userResp = await supabase.auth.getUser();
            derivedRows.push({
              title: `${file.name} (${genPath})`,
              description: null,
              category,
              bucket: "photos-derived",
              path: genPath,
              thumbnail: false,
              is_home_hero: false,
              is_photo_hero: false,
              is_video_hero: false,
              uploaded_by: userResp?.data?.user?.id ?? null,
            });
          }
        }

        if (derivedRows.length) await supabase.from("images").insert(derivedRows);

        // Pick medium preview for job display
        const medium = generated.find(g => (typeof g === "string" ? g : g?.path ?? g?.name)?.startsWith("medium/")) || generated[0];
        const mediumName = typeof medium === "string" ? medium : medium?.path ?? medium?.name ?? null;
        const pub = mediumName ? supabase.storage.from("photos-derived").getPublicUrl(mediumName).data.publicUrl : null;
        const derived = pub ? [{ path: mediumName, publicUrl: pub }] : [];
        updateJob(id, { status: "done", derived });

        const { data: existingOrig } = await supabase.from("images").select("id").eq("path", id).limit(1).maybeSingle();
        if (!existingOrig) {
          const userResp = await supabase.auth.getUser();
          const payload = {
            title: file.name,
            description: null,
            category,
            bucket: "photos-original",
            path: id,
            thumbnail: false,
            is_home_hero: false,
            is_photo_hero: false,
            is_video_hero: false,
            uploaded_by: userResp?.data?.user?.id ?? null,
          };
          await supabase.from("images").insert([payload]);
        }
      } catch (err) {
        console.error("Upload job error:", id, err);
        updateJob(id, { status: "error", error: err?.message ?? String(err) });
      }
    }

    setFiles([]);
    setIsUploading(false);
    await loadImagesAndDerived();
  };

  // Admin actions: delete, hero, thumbnail (same as before)
  const handleDelete = async (job) => {
    if (!window.confirm(`Delete ${job.name} and all derived variants? This cannot be undone.`)) return;
    updateJob(job.id, { status: "deleting", error: null });
    try {
      const path = job.dbRow?.path ?? job.id;
      const base = path.replace(/\.[^/.]+$/, "");
      for (const size of SIZES) {
        const { data: items } = await supabase.storage.from("photos-derived").list(size, { limit: 2000 });
        if (!items) continue;
        const toDelete = items.filter(i => i.name.includes(base)).map(i => (i.name.startsWith(`${size}/`) ? i.name : `${size}/${i.name}`));
        if (toDelete.length) await supabase.storage.from("photos-derived").remove(toDelete);
      }
      await supabase.storage.from("photos-original").remove([path]);
      await supabase.from("images").delete().eq("path", path);
      await loadImagesAndDerived();
    } catch (err) {
      console.error("Delete error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
    }
  };

  const setHeroFor = async (job, type) => {
    if (!job.dbRow?.id) return alert("Image must exist in DB to set hero.");
    const col = HERO_COLUMN_FOR_TYPE[type];
    if (!window.confirm(`Make "${job.name}" the ${type} hero?`)) return;
    updateJob(job.id, { status: "setting-hero", error: null });
    try {
      await supabase.from("images").update({ [col]: false }).eq(col, true);
      await supabase.from("images").update({ [col]: true }).eq("id", job.dbRow.id);
      await loadImagesAndDerived();
    } catch (err) {
      console.error("setHeroFor error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
    }
  };

  const setThumbnailForCategory = async (job) => {
    if (!job.dbRow?.id || !job.dbRow.category) return alert("Image must exist in DB and have category.");
    if (!window.confirm(`Make "${job.name}" the thumbnail for category "${job.dbRow.category}"?`)) return;
    updateJob(job.id, { status: "setting-thumbnail", error: null });
    try {
      await supabase.from("images").update({ thumbnail: false }).eq("category", job.dbRow.category).eq("thumbnail", true);
      await supabase.from("images").update({ thumbnail: true }).eq("id", job.dbRow.id);
      await loadImagesAndDerived();
    } catch (err) {
      console.error("setThumbnailForCategory error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
    }
  };

  if (loadingAuth) return <p>Logging in as admin...</p>;

  return (
    <>
      <Nav />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        {error && <div className="error">{error}</div>}

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <input type="file" multiple onChange={handleFilesChange} />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <button onClick={handleUploadAll} disabled={!files.length || isUploading}>
            {isUploading ? "Uploading..." : `Upload ${files.length ? `(${files.length})` : ""}`}
          </button>
          <button onClick={loadImagesAndDerived}>Refresh</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {jobs.length === 0 && <p>No uploads / images found.</p>}
          {jobs.map(job => (
            <div key={job.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{job.name}</strong> — <span>{job.status}</span>
                  {job.dbRow && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      category: {job.dbRow.category ?? "—"}<br />
                      homeHero: {String(job.dbRow.is_home_hero)} &nbsp;
                      photoHero: {String(job.dbRow.is_photo_hero)} &nbsp;
                      videoHero: {String(job.dbRow.is_video_hero)} &nbsp;
                      thumbnail: {String(job.dbRow.thumbnail)}
                    </div>
                  )}

                  {/* Hover Preview */}
                  {job.derived?.length > 0 && (
                    <div className="hover-preview-wrapper" style={{ position: "relative", marginTop: 8 }}>
                      <img
                        src={job.derived[0].publicUrl}
                        alt={job.derived[0].path}
                        style={{ width: 160, borderRadius: 6, cursor: "pointer" }}
                      />
                      <div className="hover-preview-grid" style={{
                        display: "none",
                        position: "absolute",
                        top: 0,
                        left: 170,
                        background: "#fff",
                        border: "1px solid #ddd",
                        padding: 8,
                        borderRadius: 6,
                        zIndex: 10,
                        flexWrap: "wrap",
                        gap: 4,
                      }}>
                        {job.derived.map((d, idx) => (
                          <img key={idx} src={d.publicUrl} alt={d.path} style={{ width: 80, borderRadius: 4 }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button onClick={() => handleDelete(job)}>Delete</button>
                  <button onClick={() => setHeroFor(job, "home")}>Make Home Hero</button>
                  <button onClick={() => setHeroFor(job, "photo")}>Make Photo Hero</button>
                  <button onClick={() => setHeroFor(job, "video")}>Make Video Hero</button>
                  <button onClick={() => setThumbnailForCategory(job)}>Make Category Thumbnail</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hover preview CSS */}
      <style>{`
        .hover-preview-wrapper:hover .hover-preview-grid {
          display: flex;
        }
      `}</style>
    </>
  );
}
