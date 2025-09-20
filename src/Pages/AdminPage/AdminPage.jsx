import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import "./AdminPage.scss";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

const supabase = createClient(PROJECT_URL, ANON_KEY);
const supabaseAdmin = createClient(PROJECT_URL, import.meta.env.VITE_SERVICE_ROLE_KEY);

const SIZES = ["small", "medium", "large"];
const FORMATS = ["webp", "avif"];
const CATEGORIES = ["car", "sports", "drone", "portrait", "product", "misc"];
const HERO_COLUMN_FOR_TYPE = {
  home: "is_home_hero",
  photo: "is_photo_hero",
  video: "is_video_hero",
};
const SPECIAL_COLUMN_FOR_TYPE = {
  contact: "is_contact_image",
  about: "is_about_image",
  logo: "is_logo_image",
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
  const [filterCategory, setFilterCategory] = useState("all");
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
            is_contact_image: false,
            is_about_image: false,
            is_logo_image: false,
            uploaded_by: null,
          });
        }
      }
      console.log("Backfill complete");
    } catch (err) {
      console.error("Backfill error:", err);
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

      const originals = dbRows.filter(row => row.bucket === "photos-original");

      const jobsMapped = originals.map((orig) => {
        const derivedPaths = orig.derived_paths || {};
        let preview = null;
        if (derivedPaths.medium?.webp) {
          const { data: pub } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(derivedPaths.medium.webp);
          preview = pub?.publicUrl ?? null;
        }
        return {
          id: orig.id,
          name: orig.title || orig.path,
          status: Object.keys(derivedPaths).length ? "done" : "missing-derived",
          derived_paths: derivedPaths,
          path: orig.path,
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

const handleUploadAll = async () => {
  if (!files.length) return;
  setIsUploading(true);

  for (const f of files) {
    // Mark file as uploading
    setFiles(prev =>
      prev.map(fileObj =>
        fileObj.id === f.id ? { ...fileObj, status: "uploading", progress: 0 } : fileObj
      )
    );

    try {
      // 1️⃣ Upload original file
      const { error: uploadErr } = await supabase.storage
        .from("photos-original")
        .upload(f.id, f.file, { upsert: true });
      if (uploadErr) throw uploadErr;

      setFiles(prev =>
        prev.map(fileObj =>
          fileObj.id === f.id ? { ...fileObj, progress: 50 } : fileObj
        )
      );

      // 2️⃣ Call thumbnail service
      const resp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "photos-original", file: f.id }),
      });

      if (!resp.ok) throw new Error(`Thumbnail service error: ${resp.statusText}`);

      const respJson = await resp.json();
      console.log("Service response:", respJson);

      // ✅ Initialize derivedPathsObj safely
      let derivedPathsObj = {};
      if (!respJson.ok || !respJson.generatedPaths) {
        console.warn("Thumbnail generation failed for:", f.id);
      } else {
        derivedPathsObj = respJson.generatedPaths;
      }
      console.log("Derived paths object:", derivedPathsObj);

      // 3️⃣ Insert/update database row
      const { data: existing } = await supabase
        .from("images")
        .select("id, derived_paths")
        .eq("path", f.id)
        .limit(1)
        .maybeSingle();

      const userResp = await supabase.auth.getUser();
      const dbPayload = {
        title: f.file.name,
        category,
        bucket: "photos-original",
        path: f.id,
        uploaded_by: userResp?.data?.user?.id ?? null,
        derived_paths: derivedPathsObj,
      };

      if (!existing) {
        await supabase.from("images").insert([dbPayload]);
        console.log("[DB] Inserted new image row:", dbPayload);
      } else {
        await supabase.from("images").update(dbPayload).eq("id", existing.id);
        console.log("[DB] Updated existing image row:", existing.id);
      }

      // 4️⃣ Mark success
      setFiles(prev =>
        prev.map(fileObj =>
          fileObj.id === f.id ? { ...fileObj, status: "done", progress: 100 } : fileObj
        )
      );
    } catch (err) {
      console.error("Upload error:", f.id, err);
      setFiles(prev =>
        prev.map(fileObj =>
          fileObj.id === f.id ? { ...fileObj, status: "error", progress: 0 } : fileObj
        )
      );
    }
  }

  setIsUploading(false);
  await loadImagesAndDerived();
};

async function handleDelete(job) {
  try {
    if (!job) {
      console.warn("[DELETE] No job provided, skipping deletion.");
      return;
    }

    console.log(`[DELETE] Deleting job: ${job.name || "undefined"} (DB ID: ${job.id})`);

    let anyDeleted = false;

    // ---------------- Call deletion API ----------------
    try {
      const resp = await fetch(`${SERVICE_URL}/delete-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: job.path, derived_paths: job.derived_paths }),
      });

      const result = await resp.json();
      if (!resp.ok || !result.ok) {
        console.warn("[DELETE] API deletion failed:", result?.error ?? "Unknown error");
      } else {
        console.log("[DELETE] API deletion successful:", result);
        anyDeleted = true;
      }
    } catch (err) {
      console.error("[DELETE] Failed to call deletion API:", err);
    }

    // ---------------- Remove DB Row ----------------
    if (anyDeleted) {
      const { error } = await supabaseAdmin.from("images").delete().eq("id", job.id);
      if (error) console.warn("[DELETE] Failed to remove DB row:", error);
      else console.log(`[DELETE] DB row removed for job: ${job.id}`);
    } else {
      console.log("[DELETE] Nothing deleted, skipping DB removal.");
    }

  } catch (err) {
    console.error("[DELETE] Unexpected error:", err);
  }
}


  // ---------------- HERO / SPECIAL / THUMBNAIL ----------------
  const updateJob = (id, patch) => setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

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

  const setSpecialImage = async (job, type) => {
    if (!job.dbRow?.id) return alert("Image must exist in DB to set this flag.");
    const col = SPECIAL_COLUMN_FOR_TYPE[type];
    if (!col) return;
    if (!window.confirm(`Make "${job.name}" the ${type} image?`)) return;
    updateJob(job.id, { status: `setting-${type}`, error: null });
    try {
      await supabase.from("images").update({ [col]: false }).eq(col, true);
      await supabase.from("images").update({ [col]: true }).eq("id", job.dbRow.id);
      await loadImagesAndDerived();
    } catch (err) {
      console.error("setSpecialImage error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
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

  // ---------------- RENDER ----------------
  if (loadingAuth) return <PageLoader />;

  return (
    <>
      <Nav />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        {error && <div className="error">{error}</div>}

        <div className="admin-controls">
          <label className="file-upload-btn">
            Choose Files
            <input
              type="file"
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files).map((f) => ({
                  file: f,
                  id: makeUniqueName(f.name),
                  status: "pending",
                  progress: 0,
                }));
                setFiles((prev) => [...prev, ...newFiles]);
              }}
              style={{ display: "none" }}
            />
          </label>

          {files.length > 0 && (
            <div className="file-preview-list">
              {files.map(({ file, progress, status }, idx) => (
                <div key={idx} className="file-preview">
                  <span className="filename">{file.name}</span>
                  <span>{status}</span>
                  <progress value={progress} max="100">{progress}%</progress>
                </div>
              ))}
            </div>
          )}

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

        <div className="filter-controls">
          <div className="filter-subcontainer">
               <label className="filter-label">
            <p>Filter by category:</p>{" "}
          
         
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
        </div>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 && <p>No uploads / images found.</p>}
          {jobs
            .filter((job) => filterCategory === "all" ? true : job.dbRow?.category === filterCategory)
            .map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-info">
                  <strong>{job.name}</strong> — <span>{job.status}</span>
                  {job.dbRow && (
                    <div className="job-meta">
                      category: {job.dbRow.category ?? "—"}
                      <br />
                      homeHero: {String(job.dbRow.is_home_hero)} &nbsp;
                      photoHero: {String(job.dbRow.is_photo_hero)} &nbsp;
                      videoHero: {String(job.dbRow.is_video_hero)} &nbsp;
                      thumbnail: {String(job.dbRow.thumbnail)} <br />
                      contact: {String(job.dbRow.is_contact_image)} &nbsp;
                      about: {String(job.dbRow.is_about_image)} &nbsp;
                      logo: {String(job.dbRow.is_logo_image)}
                    </div>
                  )}
                  {job.preview && (
                    <div className="hover-preview-wrapper">
                      <img src={job.preview} alt={job.name} className="preview-img" />
                      <div className="copy-field">
                        <input type="text" readOnly value={job.preview} />
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(job.preview)}>Copy</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="job-actions">
                  <button onClick={() => handleDelete(job)}>Delete All</button>
                  <button onClick={() => setHeroFor(job, "home")}>Make Home Hero</button>
                  <button onClick={() => setHeroFor(job, "photo")}>Make Photo Hero</button>
                  <button onClick={() => setHeroFor(job, "video")}>Make Video Hero</button>
                  <button onClick={() => setThumbnailForCategory(job)}>Make Category Thumbnail</button>
                  <button onClick={() => setSpecialImage(job, "contact")}>Make Contact Image</button>
                  <button onClick={() => setSpecialImage(job, "about")}>Make About Image</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}