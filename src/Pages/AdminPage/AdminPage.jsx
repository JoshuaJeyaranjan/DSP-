// AdminPage.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import "./AdminPage.scss";

// Env variables
const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

// create supabase client
const supabase = createClient(PROJECT_URL, ANON_KEY);

const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];

function makeUniqueName(name) {
  // deterministic-ish unique name per selection moment (timestamp + random suffix)
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) return `${ts}-${rand}-${name}`;
  const base = name.slice(0, dotIndex);
  const ext = name.slice(dotIndex);
  const cleanBase = base.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
  return `${ts}-${rand}-${cleanBase}${ext}`;
}

const AdminPage = () => {
  // files holds objects: { file: File, id: string }
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);

  // jobs: a list used to render all images + upload progress
  // job shape: { id, name, status, derived: [{ path, publicUrl }], error, dbRow }
  const [jobs, setJobs] = useState([]);

  // Auth on mount, then load images
  useEffect(() => {
    const loginAndLoad = async () => {
      setLoadingAuth(true);
      setError(null);
      try {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

        if (authErr) {
          console.error("Admin login failed:", authErr);
          setError("Admin login failed - check env variables.");
          setLoadingAuth(false);
          return;
        }

        // load existing images into jobs view
        await loadImagesFromDB();
      } catch (err) {
        console.error("Auth error:", err);
        setError("Admin authentication error.");
      } finally {
        setLoadingAuth(false);
      }
    };

    loginAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to set or update a job
  const updateJob = (id, patch) => {
    setJobs((prev) => {
      const found = prev.find((j) => j.id === id);
      if (found) return prev.map((j) => (j.id === id ? { ...j, ...patch } : j));
      return [...prev, { id, ...patch }];
    });
  };

  // parse session token (newer SDK)
  const getAccessToken = async () => {
    try {
      const s = await supabase.auth.getSession();
      return s?.data?.session?.access_token ?? null;
    } catch {
      // fallback older SDK
      // @ts-ignore
      return supabase.auth?.session?.()?.access_token ?? null;
    }
  };

  // Load images from images table and attach derived thumbnail publicUrls
  const loadImagesFromDB = async () => {
    try {
      const { data, error: dbErr } = await supabase.from("images").select("*").order("created_at", { ascending: false });
      if (dbErr) {
        console.error("Failed loading images:", dbErr);
        setError("Failed to load images from DB.");
        return;
      }

      // For each image row, find derived thumbnails in storage and public URLs
      const jobsFromDB = await Promise.all(
        (data || []).map(async (img) => {
          const baseName = img.path.replace(/\.[^/.]+$/, ""); // filename without ext
          // search derived bucket for files containing the baseName
          const { data: derivedFiles, error: listErr } = await supabase.storage
            .from("photos-derived")
            .list("", { search: baseName, limit: 100 });

          let derived = [];
          if (!listErr && derivedFiles && derivedFiles.length) {
            derived = derivedFiles.map((f) => {
              const { data: pd } = supabase.storage.from("photos-derived").getPublicUrl(f.name);
              return { path: f.name, publicUrl: pd?.publicUrl ?? "" };
            });
          }

          return {
            id: img.path, // use DB path as stable id
            name: img.title || img.path,
            status: "done",
            derived,
            dbRow: img,
            error: null,
          };
        })
      );

      setJobs(jobsFromDB);
    } catch (err) {
      console.error("loadImagesFromDB error:", err);
      setError("Error loading images.");
    }
  };

  // When selecting files, create a deterministic id once per file and set files state
  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const prepared = selected.map((f) => ({ file: f, id: makeUniqueName(f.name) }));
    // add to files array
    setFiles(prepended => [...prepended, ...prepared]);

    // create pending jobs (do not call makeUniqueName again)
    setJobs((prev) => [
      ...prev,
      ...prepared.map((p) => ({
        id: p.id,
        name: p.file.name,
        status: "pending",
        derived: [],
        error: null,
      })),
    ]);
    setError(null);
  };

  // upload sequence for all selected files (uses the precomputed ids)
  const handleUploadAll = async () => {
    if (!files.length) return;
    setError(null);

    // iterate sequentially
    for (const fObj of files) {
      const { file, id } = fObj;
      updateJob(id, { status: "uploading", error: null });

      try {
        // 1) Upload original using the stable id
        const { error: uploadErr } = await supabase.storage.from("photos-original").upload(id, file, {
          upsert: true,
        });
        if (uploadErr) throw uploadErr;
        updateJob(id, { status: "uploaded" });

        // 2) call thumbnail service
        updateJob(id, { status: "generating" });
        const token = await getAccessToken();
        const resp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // only include Authorization header if token is present
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            bucket: "photos-original",
            file: id,
            category,
          }),
        });

        let result;
        try {
          result = await resp.json();
        } catch (err) {
          throw new Error(`Thumbnail service returned non-JSON (status ${resp.status})`);
        }

        if (!resp.ok || !result?.ok) throw new Error(result?.error || `Thumbnail service failed (${resp.status})`);

        const generated = Array.isArray(result.generated) ? result.generated : [];
        if (!generated.length) throw new Error("Thumbnail service returned no generated images");

        // 3) Get public urls for derived items
        const derived = generated
          .map((g) => {
            const path = typeof g === "string" ? g : g?.path ?? g?.name ?? null;
            if (!path) return null;
            const { data: pd } = supabase.storage.from("photos-derived").getPublicUrl(path);
            return { path, publicUrl: pd?.publicUrl ?? null };
          })
          .filter(Boolean);

        if (!derived.length) throw new Error("No public URLs available for generated images");

        // 4) Insert metadata into images table only if not already present
        const { data: exists, error: existsErr } = await supabase.from("images").select("id").eq("path", id).limit(1).maybeSingle();
        if (existsErr) {
          console.warn("exists check error:", existsErr);
        }

        if (!exists) {
          const { data: userData } = await supabase.auth.getUser();
          const insertPayload = {
            title: file.name,
            description: null,
            category,
            bucket: "photos-original",
            path: id,
            thumbnail: false,
            hero: false,
            gallery_order: null,
            uploaded_by: userData?.data?.user?.id ?? userData?.user?.id ?? null,
          };
          const { error: insertErr } = await supabase.from("images").insert([insertPayload]);
          if (insertErr) {
            console.warn("DB insert error:", insertErr);
            // continue, don't block
          }
        } else {
          // already exists, optionally update metadata if you like
          console.log("Image metadata already exists for path:", id);
        }

        updateJob(id, { status: "done", derived, error: null });

      } catch (err) {
        console.error("Upload job error:", id, err);
        updateJob(id, { status: "error", error: err?.message ?? String(err) });
      }
    }

    // clear selected files (they're uploaded)
    setFiles([]);
    // optionally reload DB rows to show canonical data
    await loadImagesFromDB();
  };

  // Delete file: deletes derived images, original, and DB row
  const handleDelete = async (jobId, imagePath) => {
    if (!window.confirm("Delete this image and its thumbnails?")) return;
    updateJob(jobId, { status: "deleting", error: null });

    try {
      // find derived files by searching for base name
      const base = imagePath.replace(/\.[^/.]+$/, "");
      const { data: derivedFiles, error: listErr } = await supabase.storage.from("photos-derived").list("", { search: base, limit: 100 });
      if (listErr) {
        console.warn("Error listing derived files:", listErr);
      } else if (derivedFiles && derivedFiles.length) {
        const names = derivedFiles.map((f) => f.name);
        const { error: removeDerivedErr } = await supabase.storage.from("photos-derived").remove(names);
        if (removeDerivedErr) console.warn("Failed deleting some derived files:", removeDerivedErr);
      }

      // delete original
      const { error: removeOrigErr } = await supabase.storage.from("photos-original").remove([imagePath]);
      if (removeOrigErr) console.warn("Failed deleting original:", removeOrigErr);

      // delete DB row
      const { error: dbErr } = await supabase.from("images").delete().eq("path", imagePath);
      if (dbErr) console.warn("Failed deleting DB row:", dbErr);

      // remove from UI
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error("Delete error:", err);
      updateJob(jobId, { status: "error", error: err?.message ?? String(err) });
    }
  };

  if (loadingAuth) return <p>Logging in as admin...</p>;

  return (
    <>
      <Nav />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>

        {error && (
          <div className="error" style={{ color: "red" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
          <input type="file" multiple onChange={handleFilesChange} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <button onClick={handleUploadAll} disabled={!files.length}>
            Upload {files.length ? `(${files.length})` : ""}
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {jobs.length === 0 && <p>No images found.</p>}

          {jobs.map((job) => (
            <div key={job.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, maxWidth: 1000 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{job.name}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>{job.status}</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {job.status !== "deleting" && job.status !== "uploading" && job.status !== "generating" && job.status !== "queued" && (
                    <button
                      onClick={() => handleDelete(job.id, job.dbRow?.path ?? (job.derived?.[0]?.path ?? job.id))}
                      style={{ background: "transparent", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {job.derived && job.derived.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {job.derived.map((d, idx) => (
                    <div key={idx} style={{ width: 160 }}>
                      <img src={d.publicUrl} alt={d.path} style={{ width: "100%", borderRadius: 6 }} />
                      <small style={{ display: "block", wordBreak: "break-all", fontSize: 11 }}>{d.path}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminPage;
