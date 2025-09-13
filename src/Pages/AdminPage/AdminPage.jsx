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

  // ---------------- BACKFILL ORIGINALS ----------------
  const backfillOriginals = async () => {
    try {
      const { data: originals, error: listErr } = await supabase.storage
        .from("photos-original")
        .list("", { limit: 2000 });

      if (listErr) {
        console.error("Error listing originals:", listErr);
        return;
      }

      for (const orig of originals) {
        const { data: exists } = await supabase
          .from("images")
          .select("id")
          .eq("path", orig.name)
          .maybeSingle();

        if (!exists) {
          await supabase.from("images").insert({
            title: orig.name,
            description: null,
            category: "uncategorized",
            bucket: "photos-original",
            path: orig.name,
            thumbnail: false,
            is_home_hero: false,
            is_photo_hero: false,
            is_video_hero: false,
            uploaded_by: null,
          });
        }
      }
      console.log("Backfill complete");
    } catch (err) {
      console.error("Backfill error:", err);
    }
  };

  // ---------------- LOGIN & INITIAL LOAD ----------------
  useEffect(() => {
    const loginAndLoad = async () => {
      setLoadingAuth(true);
      try {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        if (authErr) throw authErr;

        // Run backfill automatically on mount
        await backfillOriginals();
        await loadImagesAndDerived();
      } catch (err) {
        console.error("Admin login failed:", err);
        setError("Admin login failed — check env vars.");
      } finally {
        setLoadingAuth(false);
      }
    };
    loginAndLoad();
  }, []);

  const updateJob = (id, patch) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const getAccessToken = async () => {
    try {
      const s = await supabase.auth.getSession();
      return s?.data?.session?.access_token ?? null;
    } catch {
      return supabase.auth?.session?.()?.access_token ?? null;
    }
  };

  // ---------------- LOAD IMAGES AND DERIVED ----------------
  const loadImagesAndDerived = async () => {
    setError(null);
    try {
      const { data: dbRows, error: dbErr } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbErr) console.warn("images table read error:", dbErr);
      if (!dbRows) return setJobs([]);

      const originals = dbRows.filter((row) => row.bucket === "photos-original");

      const jobsMapped = originals.map((orig) => {
        const base = orig.path.replace(/\.[^/.]+$/, "");
        const mediumWebpPath = `medium/${base}.webp`;

        const { data: pub } = supabase.storage
          .from("photos-derived")
          .getPublicUrl(mediumWebpPath);

        const derived = pub?.publicUrl ? [{ path: mediumWebpPath, publicUrl: pub.publicUrl }] : [];
        const preview = derived[0]?.publicUrl ?? null;

        return {
          id: orig.path,
          name: orig.title || orig.path,
          status: derived.length ? "done" : "missing-derived",
          derived,
          preview,
          dbRow: orig,
          error: null,
        };
      });

      setJobs(jobsMapped);
    } catch (err) {
      console.error("loadImagesAndDerived error:", err);
      setError("Failed to load images or derived files");
    }
  };

  // ---------------- FILE SELECTION & UPLOAD ----------------
  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const prepared = selected.map((f) => ({ file: f, id: makeUniqueName(f.name) }));
    setFiles((prev) => [...prev, ...prepared]);

    setJobs((prev) => [
      ...prev,
      ...prepared.map((p) => ({ id: p.id, name: p.file.name, status: "pending", derived: [], dbRow: null, error: null })),
    ]);

    setError(null);
  };

  const handleUploadAll = async () => {
    if (!files.length) return;
    setIsUploading(true);

    for (const { file, id } of files) {
      updateJob(id, { status: "uploading", error: null });
      try {
        const { error: uploadErr } = await supabase.storage.from("photos-original").upload(id, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        updateJob(id, { status: "uploaded" });

        const { data: existing } = await supabase.from("images").select("id").eq("path", id).limit(1).maybeSingle();
        if (!existing) {
          const userResp = await supabase.auth.getUser();
          await supabase.from("images").insert([{
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
          }]);
        }

        updateJob(id, { status: "done" });
      } catch (err) {
        console.error("Upload job error:", id, err);
        updateJob(id, { status: "error", error: err?.message ?? String(err) });
      }
    }

    setFiles([]);
    setIsUploading(false);
    await loadImagesAndDerived();
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (job) => {
    if (!window.confirm(`Delete ${job.name} and all derived variants? This cannot be undone.`)) return;
    updateJob(job.id, { status: "deleting", error: null });

    try {
      const base = job.dbRow.path.replace(/\.[^/.]+$/, "");
      for (const size of SIZES) {
        const { data: items } = await supabase.storage.from("photos-derived").list(size, { limit: 2000 });
        const toDelete = items.filter((i) => i.name.includes(base)).map((i) => `${size}/${i.name}`);
        if (toDelete.length) await supabase.storage.from("photos-derived").remove(toDelete);
      }
      await supabase.storage.from("photos-original").remove([job.dbRow.path]);
      await supabase.from("images").delete().or(`path.eq.${job.dbRow.path},path.in.(${job.derived.map(d => d.path).join(",")})`);
      await loadImagesAndDerived();
    } catch (err) {
      console.error("Delete error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
    }
  };

  // ---------------- HERO & THUMBNAIL ----------------
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

  // ---------------- RENDER ----------------
  if (loadingAuth) return <p>Logging in as admin...</p>;

  return (
    <>
      <Nav />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        {error && <div className="error">{error}</div>}

        <div className="admin-controls">
          <label className="file-upload-btn">
            Choose Files
            <input type="file" multiple onChange={handleFilesChange} style={{ display: "none" }} />
          </label>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>

          <button onClick={handleUploadAll} disabled={!files.length || isUploading}>
            {isUploading ? "Uploading..." : `Upload ${files.length ? `(${files.length})` : ""}`}
          </button>

          <button onClick={loadImagesAndDerived}>Refresh</button>
        </div>

        {files.length > 0 && (
          <div className="selected-files">
            {files.map((f) => <div key={f.id}>{f.file.name}</div>)}
          </div>
        )}

        <div className="jobs-grid">
          {jobs.length === 0 && <p>No uploads / images found.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-info">
                <strong>{job.name}</strong> — <span>{job.status}</span>
                {job.dbRow && (
                  <div className="job-meta">
                    category: {job.dbRow.category ?? "—"}<br />
                    homeHero: {String(job.dbRow.is_home_hero)} &nbsp;
                    photoHero: {String(job.dbRow.is_photo_hero)} &nbsp;
                    videoHero: {String(job.dbRow.is_video_hero)} &nbsp;
                    thumbnail: {String(job.dbRow.thumbnail)}
                  </div>
                )}
              {job.preview && (
  <div className="hover-preview-wrapper">
    <img src={job.preview} alt={job.name} className="preview-img" />
    <input
      type="text"
      readOnly
      value={job.preview}
      onClick={(e) => e.target.select()}
      title="Click to copy URL"
    />
  </div>
)}
              </div>

              <div className="job-actions">
                <button onClick={() => handleDelete(job)}>Delete All</button>
                <button onClick={() => setHeroFor(job, "home")}>Make Home Hero</button>
                <button onClick={() => setHeroFor(job, "photo")}>Make Photo Hero</button>
                <button onClick={() => setHeroFor(job, "video")}>Make Video Hero</button>
                <button onClick={() => setThumbnailForCategory(job)}>Make Category Thumbnail</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}