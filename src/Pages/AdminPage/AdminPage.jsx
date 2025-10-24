import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import "./AdminPage.scss";
import PageLoader from "../../Components/PageLoader/PageLoader";
import Footer from "../../Components/Footer/Footer";
const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

const supabase = createClient(PROJECT_URL, ANON_KEY);
const supabaseAdmin = createClient(
  PROJECT_URL,
  import.meta.env.VITE_SERVICE_ROLE_KEY
);


const HERO_COLUMN_FOR_TYPE = {
  home: "is_home_hero",
  photo: "is_photo_hero",
  video: "is_video_hero",
};
const SPECIAL_COLUMN_FOR_TYPE = {
  contact: "is_contact_image",
  about: "is_about_image",
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [buttonStatus, setButtonStatus] = useState({});
  const [copiedJobId, setCopiedJobId] = useState(null);
const [allCategories, setAllCategories] = useState([]);
const [visibleCategories, setVisibleCategories] = useState([]);
const [category, setCategory] = useState("uncategorized"); // current upload category

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("image_categories")
        .select("id, name, visible_on_hub")
        .order("name");
      if (error) throw error;

      setAllCategories(data || []);
      setVisibleCategories(
        data?.filter(c => c.visible_on_hub) || []
      );

      // default to the first visible category or fallback
      setCategory(data?.find(c => c.visible_on_hub)?.id || null);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setAllCategories([]);
      setVisibleCategories([]);
      setCategory(null);
    }
  };

  fetchCategories();
}, []);
  // ---------------- BUTTON FEEDBACK ----------------
  const triggerButtonStatus = (key, label = "Done", duration = 1500) => {
    setButtonStatus((prev) => ({ ...prev, [key]: label }));
    setTimeout(() => {
      setButtonStatus((prev) => ({ ...prev, [key]: null }));
    }, duration);
  };

  // ---------------- BACKFILL ORIGINALS ----------------
  const backfillOriginals = async () => {
    try {
      const { data: originals, error: listErr } = await supabase.storage
        .from("photos-original")
        .list("", { limit: 2000 });
      if (listErr) return console.error(listErr);

      for (const orig of originals) {
        const { data: exists } = await supabase
          .from("images")
          .select("id")
          .eq("path", orig.name)
          .maybeSingle();

        if (!exists) {
          await supabase.from("images").insert({
            title: orig.name,
            category: "uncategorized",
            bucket: "photos-original",
            path: orig.name,
            thumbnail: false,
            is_home_hero: false,
            is_photo_hero: false,
            is_video_hero: false,
            is_contact_image: false,
            is_about_image: false,
            uploaded_by: null,
          });
        }
      }
    } catch (err) {
      console.error("Backfill error:", err);
    }
  };

  // ---------------- LOAD IMAGES ----------------
  const loadImagesAndDerived = async () => {
    setError(null);
    try {
      const { data: dbRows, error: dbErr } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbErr) console.warn(dbErr);
      if (!dbRows) return setJobs([]);

      const originals = dbRows.filter((row) => row.bucket === "photos-original");
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
        };
      });

      setJobs(jobsMapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load images");
    }
  };

  // ---------------- UPLOAD ----------------
const handleUploadAll = async () => {
  if (!files.length) return;
  setIsUploading(true);

  // Resolve category_id once and cache it
  let category_id = null;
  try {
    console.log("[CATEGORY] Current selected category (name):", category);

    // Attempt to find id for the selected category
    const category_id = category; // we already stored the ID directly

    if (catErr) {
      console.warn("[CATEGORY] Error querying image_categories:", catErr);
    } else if (catData) {
      category_id = catData.id;
      console.log("[CATEGORY] Found category id:", category_id, "for name:", catData.name);
    } else {
      console.warn("[CATEGORY] No category row found for name:", category);
    }

    // If we still don't have one, try to use "uncategorized" row as fallback
    if (!category_id) {
      const { data: uncData, error: uncErr } = await supabase
        .from("image_categories")
        .select("id, name")
        .eq("name", "uncategorized")
        .maybeSingle();

      if (uncErr) {
        console.warn("[CATEGORY] Error querying uncategorized row:", uncErr);
      } else if (uncData) {
        category_id = uncData.id;
        console.log("[CATEGORY] Using fallback 'uncategorized' id:", category_id);
      } else {
        console.warn("[CATEGORY] No 'uncategorized' row found. category_id will be null.");
      }
    }
  } catch (err) {
    console.error("[CATEGORY] Unexpected error resolving category_id:", err);
  }

  // Upload loop
  for (const f of files) {
    // UI state: mark uploading
    setFiles((prev) =>
      prev.map((fileObj) =>
        fileObj.id === f.id ? { ...fileObj, status: "uploading", progress: 0 } : fileObj
      )
    );

    try {
      console.log(`\n[UPLOAD] Starting upload for ${f.file.name} (path: ${f.id})`);
      console.log("[UPLOAD] file size:", f.file.size, "type:", f.file.type);

      // 1) Upload file to storage
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("photos-original")
        .upload(f.id, f.file, { upsert: true });

      if (uploadErr) {
        console.error("[UPLOAD] Storage upload error:", uploadErr);
        throw uploadErr;
      }
      console.log("[UPLOAD] Storage upload success:", uploadData);

      setFiles((prev) =>
        prev.map((fileObj) =>
          fileObj.id === f.id ? { ...fileObj, progress: 50 } : fileObj
        )
      );

      // 2) Generate thumbnails (you already have this working)
      console.log("[UPLOAD] Requesting thumbnails generation...");
      const thumbResp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "photos-original", file: f.id }),
      });

      if (!thumbResp.ok) {
        const text = await thumbResp.text().catch(() => "");
        console.error("[UPLOAD] Thumbnail service error:", thumbResp.status, thumbResp.statusText, text);
        throw new Error("Thumbnail generation failed");
      }

      const thumbJson = await thumbResp.json();
      const derivedPathsObj = thumbJson.generatedPaths || {};
      console.log("[UPLOAD] Thumbnails generated:", derivedPathsObj);

      // 3) Prepare DB payload using category_id (not category string)
      const userResp = await supabase.auth.getUser();
      const dbPayload = {
        title: f.file.name,
        category_id,            // <- INT foreign key expected by images table
        bucket: "photos-original",
        path: f.id,
        uploaded_by: userResp?.data?.user?.id ?? null,
        derived_paths: derivedPathsObj,
      };
      console.log("[DB] dbPayload prepared:", dbPayload);

      // 4) Insert or update the images row
      const { data: existing } = await supabase
        .from("images")
        .select("id")
        .eq("path", f.id)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { data: insertData, error: insertErr } = await supabase.from("images").insert([dbPayload]);
        if (insertErr) {
          console.error("[DB] Insert error:", insertErr);
          throw insertErr;
        }
        console.log("[DB] Insert succeeded:", insertData);
      } else {
        const { data: updateData, error: updateErr } = await supabase.from("images").update(dbPayload).eq("id", existing.id);
        if (updateErr) {
          console.error("[DB] Update error:", updateErr);
          throw updateErr;
        }
        console.log("[DB] Update succeeded:", updateData);
      }

      // 5) Mark done in UI
      setFiles((prev) =>
        prev.map((fileObj) =>
          fileObj.id === f.id ? { ...fileObj, status: "done", progress: 100 } : fileObj
        )
      );
      console.log(`[UPLOAD] Finished ${f.file.name}`);
    } catch (err) {
      console.error(`[UPLOAD] Error with ${f.file.name}:`, err);
      setFiles((prev) =>
        prev.map((fileObj) =>
          fileObj.id === f.id ? { ...fileObj, status: "error", progress: 0 } : fileObj
        )
      );
    }
  }

  // clear UI selection and refresh admin list
  setFiles([]);
  setCategory("uncategorized");
  setIsUploading(false);
  triggerButtonStatus("upload-all", "Uploaded!");
  await loadImagesAndDerived();
  // optional full reload if state still stale:
  // window.location.reload();
};
  // ---------------- DELETE ----------------
  async function handleDelete(job) {
    if (!job) return;
    let anyDeleted = false;

    try {
      const resp = await fetch(`${SERVICE_URL}/delete-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: job.path, derived_paths: job.derived_paths }),
      });
      const result = await resp.json();
      if (resp.ok && result.ok) anyDeleted = true;
    } catch (err) {
      console.error(err);
    }

    if (anyDeleted) {
      const { error } = await supabaseAdmin.from("images").delete().eq("id", job.id);
      if (!error) triggerButtonStatus(`delete-${job.id}`, "Deleted!");
    }

    await loadImagesAndDerived();
  }

  // ---------------- HERO / SPECIAL / THUMBNAIL ----------------
  const updateJob = (id, patch) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const setHeroFor = async (job, type) => {
    if (!job.dbRow?.id) return;
    if (!window.confirm(`Make "${job.name}" the ${type} hero?`)) return;

    const col = HERO_COLUMN_FOR_TYPE[type];
    try {
      await supabase.from("images").update({ [col]: false }).eq(col, true);
      await supabase.from("images").update({ [col]: true }).eq("id", job.dbRow.id);
      triggerButtonStatus(`hero-${job.id}-${type}`, "Set!");
      await loadImagesAndDerived();
    } catch (err) {
      console.error(err);
    }
  };



  const setSpecialImage = async (job, type) => {
    if (!job.dbRow?.id) return;
    const col = SPECIAL_COLUMN_FOR_TYPE[type];
    if (!col) return;
    if (!window.confirm(`Make "${job.name}" the ${type} image?`)) return;

    try {
      await supabase.from("images").update({ [col]: false }).eq(col, true);
      await supabase.from("images").update({ [col]: true }).eq("id", job.dbRow.id);
      triggerButtonStatus(`special-${job.id}-${type}`, "Set!");
      await loadImagesAndDerived();
    } catch (err) {
      console.error(err);
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
        console.error(err);
        setError("Admin login failed — check env vars.");
      } finally {
        setLoadingAuth(false);
      }
    };
    loginAndLoad();
  }, []);

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
              {files.map(({ file, progress, status }) => (
                <div key={file.name} className="file-preview">
                  <span className="filename">{file.name}</span>
                  <span>{status}</span>
                  <progress value={progress} max="100">{progress}%</progress>
                </div>
              ))}
            </div>
          )}

<select
  value={category || ""}
  onChange={(e) => setCategory(Number(e.target.value))}
>
  {allCategories.map((cat) => (
    <option key={cat.id} value={cat.id}>
      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
    </option>
  ))}
</select>

          <button
            onClick={handleUploadAll}
            disabled={!files.length || isUploading}
          >
            {buttonStatus["upload-all"] || (isUploading ? "Uploading..." : `Upload ${files.length ? `(${files.length})` : ""}`)}
          </button>

          <button onClick={() => { loadImagesAndDerived(); triggerButtonStatus("refresh", "Refreshed!"); }}>
            {buttonStatus["refresh"] || "Refresh"}
          </button>
        </div>

        <div className="filter-controls">
          <label>
            
<select
  value={filterCategory}
  onChange={(e) => setFilterCategory(e.target.value)}
>
  <option value="all">All</option>
  {allCategories.map((cat) => (
    <option key={cat} value={cat}>
      {cat.charAt(0).toUpperCase() + cat.slice(1)}
    </option>
  ))}
</select>
          </label>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 && <p>No uploads / images found.</p>}
          {jobs
            .filter((job) => filterCategory === "all" ? true : job.dbRow?.category === filterCategory)
            .map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-info">
                  <strong>{job.name}</strong> — <span>{job.status}</span>
                  {job.preview && (
                    <div className="hover-preview-wrapper">
                      <img src={job.preview} alt={job.name} className="preview-img" />
                      <button
                        className={`copy-btn ${copiedJobId === job.id ? "copied" : ""}`}
                        onClick={() => {
                          navigator.clipboard.writeText(job.preview)
                            .then(() => { setCopiedJobId(job.id); triggerButtonStatus(`copy-${job.id}`, "Copied!"); setTimeout(() => setCopiedJobId(null), 1500); })
                            .catch(console.error);
                        }}
                      >
                        {buttonStatus[`copy-${job.id}`] || "Copy URL"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="job-actions">
                  
                  <button onClick={() => setHeroFor(job, "home")}>
                    {buttonStatus[`hero-${job.id}-home`] || "Make Home Hero"}
                  </button>
                  <button onClick={() => setHeroFor(job, "photo")}>
                    {buttonStatus[`hero-${job.id}-photo`] || "Make Photo Hero"}
                  </button>
                  <button onClick={() => setHeroFor(job, "video")}>
                    {buttonStatus[`hero-${job.id}-video`] || "Make Video Hero"}
                  </button>
             
                  <button className="contact-button" onClick={() => setSpecialImage(job, "contact")}>
                    {buttonStatus[`special-${job.id}-contact`] || "Make Contact Image"}
                  </button>
                  <button className="about-button" onClick={() => setSpecialImage(job, "about")}>
                    {buttonStatus[`special-${job.id}-about`] || "Make About Image"}
                  </button>
                  <button onClick={() => handleDelete(job)}>
                    {buttonStatus[`delete-${job.id}`] || "Delete All"}
                  </button>
                </div>
                
              </div>
            ))}
        </div>
      </div>
      <Footer/>
    </>
  );
}