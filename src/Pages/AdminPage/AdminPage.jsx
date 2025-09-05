// AdminPage.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import "./AdminPage.scss";

// Env vars (set in your Vite env)
const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

// supabase client
const supabase = createClient(PROJECT_URL, ANON_KEY);

// Derived sizes & formats must match what your thumbnail service writes
const SIZES = ["small", "medium", "large"];
const FORMATS = ["avif", "webp", "jpg", "jpeg"]; // fallback candidate extensions

// categories for upload (optional)
const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];

// create a stable unique filename (used for upload destination)
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
  const [files, setFiles] = useState([]); // [{ file, id }]
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]); // visible items: { id, name, status, derived: [{path, publicUrl}], dbRow, error }
  const [isUploading, setIsUploading] = useState(false);

  // login as admin on mount
  useEffect(() => {
    const login = async () => {
      setLoadingAuth(true);
      try {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        if (authErr) {
          console.error("Admin login failed:", authErr);
          setError("Admin login failed — check env vars.");
          setLoadingAuth(false);
          return;
        }
        await loadImagesAndDerived();
      } catch (err) {
        console.error("Auth error:", err);
        setError("Auth error");
      } finally {
        setLoadingAuth(false);
      }
    };
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to update or add a job
  const updateJob = (id, patch) => {
    setJobs((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return [...prev, { id, ...patch }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  // get session token
  const getAccessToken = async () => {
    try {
      const s = await supabase.auth.getSession();
      return s?.data?.session?.access_token ?? null;
    } catch {
      // fallback for older SDKs
      // @ts-ignore
      return supabase.auth?.session?.()?.access_token ?? null;
    }
  };

  // Load images table rows and corresponding derived public urls
  const loadImagesAndDerived = async () => {
    setError(null);
    try {
      // 1) fetch DB rows from images table
      const { data: dbRows, error: dbErr } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbErr) console.warn("images table read error:", dbErr);

      // 2) build a derived-file index by listing each size folder
      const derivedIndex = {}; // key: fullPath (size/filename), value: publicUrl
      for (const size of SIZES) {
        const { data, error: listErr } = await supabase.storage.from("photos-derived").list(size, { limit: 2000 });
        if (listErr) {
          // If folder doesn't exist it's fine — keep going
          console.warn(`photos-derived list ${size} error:`, listErr);
          continue;
        }
        if (!data) continue;
        for (const item of data) {
          const candidateFull = item.name.startsWith(`${size}/`) ? item.name : `${size}/${item.name}`;
          const { data: pd } = supabase.storage.from("photos-derived").getPublicUrl(candidateFull);
          derivedIndex[candidateFull] = pd?.publicUrl ?? null;
          // also store plain filename fallback
          derivedIndex[item.name] = pd?.publicUrl ?? null;
        }
      }

      // 3) Map DB rows to jobs if any
      if (dbRows && dbRows.length) {
        const mapped = dbRows.map((row) => {
          const base = row.path.replace(/\.[^/.]+$/, "");
          const preferred = `medium/${base}.avif`;
          let publicUrl = derivedIndex[preferred] ?? null;
          if (!publicUrl) {
            const fallbackKey = Object.keys(derivedIndex).find((k) => k.includes(base) && /\.(avif|webp|jpe?g)$/i.test(k));
            publicUrl = fallbackKey ? derivedIndex[fallbackKey] : null;
          }
          const derived = publicUrl ? [{ path: preferred, publicUrl }] : [];
          return { id: row.path, name: row.title || row.path, status: derived.length ? "done" : "missing-derived", derived, dbRow: row, error: null };
        });
        setJobs(mapped);
        return;
      }

      // 4) DB empty — fallback to list originals and stitch derived previews from derivedIndex
      const { data: originals, error: origErr } = await supabase.storage.from("photos-original").list("", { limit: 2000 });
      if (origErr) {
        console.warn("photos-original list error:", origErr);
        setJobs([]);
        return;
      }
      const fallback = originals.map((o) => {
        const path = o.name;
        const base = path.replace(/\.[^/.]+$/, "");
        const preferred = `medium/${base}.avif`;
        const fallbackKey = Object.keys(derivedIndex).find((k) => k.includes(base) && /\.(avif|webp|jpe?g)$/i.test(k));
        const publicUrl = derivedIndex[preferred] || (fallbackKey ? derivedIndex[fallbackKey] : null);
        const derived = publicUrl ? [{ path: preferred, publicUrl }] : [];
        return { id: path, name: path, status: derived.length ? "done" : "missing-derived", derived, dbRow: null, error: null };
      });
      setJobs(fallback);
    } catch (err) {
      console.error("loadImagesAndDerived error:", err);
      setError("Failed to load images or derived files");
    }
  };

  // file input handler (dedupe by filename)
  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const prepared = selected.map((f) => ({ file: f, id: makeUniqueName(f.name) }));

    // Avoid duplicate ids (if user re-selects same file during session)
    setFiles((prev) => {
      const existingNames = new Set(prev.map((p) => p.file.name));
      const filtered = prepared.filter((p) => !existingNames.has(p.file.name));
      return [...prev, ...filtered];
    });

    // Add jobs for the new files only
    setJobs((prev) => {
      const existingNames = new Set(prev.map((j) => j.name));
      return [
        ...prev,
        ...prepared.filter((p) => !existingNames.has(p.file.name)).map((p) => ({ id: p.id, name: p.file.name, status: "pending", derived: [], dbRow: null, error: null })),
      ];
    });
    setError(null);
  };

  // Upload selected files sequentially
  const handleUploadAll = async () => {
    setError(null);
    if (!files.length) return;
    setIsUploading(true);

    for (const fObj of files) {
      const { file, id } = fObj;
      updateJob(id, { status: "uploading", error: null });

      try {
        // Upload original under id (this is the exact key we will store in DB)
        console.log("Uploading original to photos-original with key:", id);
        const { error: uploadErr } = await supabase.storage.from("photos-original").upload(id, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        updateJob(id, { status: "uploaded" });

        // Call thumbnail service
        updateJob(id, { status: "generating" });
        const token = await getAccessToken();
        const resp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ bucket: "photos-original", file: id, category }),
        });

        let result;
        try { result = await resp.json(); } catch (e) { throw new Error(`Thumbnail service returned non-JSON (status ${resp.status})`); }

        if (!resp.ok || !result?.ok) throw new Error(result?.error || `Thumbnail service failed (${resp.status})`);

        const generated = Array.isArray(result.generated) ? result.generated : [];
        if (!generated.length) throw new Error("Thumbnail service returned 0 generated images");

        // pick a reasonable preview (prefer medium avif)
        const medium = generated.find((g) => {
          const name = typeof g === "string" ? g : g?.path ?? g?.name ?? "";
          return name.startsWith("medium/") && name.endsWith(".avif");
        }) || generated[0];
        const mediumName = typeof medium === "string" ? medium : medium?.path ?? medium?.name ?? null;
        const pub = mediumName ? supabase.storage.from("photos-derived").getPublicUrl(mediumName).data.publicUrl : null;
        const derived = pub ? [{ path: mediumName, publicUrl: pub }] : [];

        updateJob(id, { status: "done", derived });

        // Insert into DB if not present (use same path key: id)
        const { data: existing } = await supabase.from("images").select("id, path").eq("path", id).limit(1).maybeSingle();
        if (!existing) {
          const userResp = await supabase.auth.getUser();
          const userId = userResp?.data?.user?.id ?? null;
          const payload = { title: file.name, description: null, category, bucket: "photos-original", path: id, thumbnail: false, hero: false, uploaded_by: userId };
          const { error: insertErr } = await supabase.from("images").insert([payload]);
          if (insertErr) console.warn("images insert error:", insertErr);
          else console.log("Inserted images row for path:", id);
        } else {
          console.log("DB row already exists for path:", id);
        }
      } catch (err) {
        console.error("upload job error:", id, err);
        updateJob(id, { status: "error", error: err?.message ?? String(err) });
      }
    }

    // clear selected files and refresh listing
    setFiles([]);
    setIsUploading(false);
    await loadImagesAndDerived();
  };

  // Delete a job: remove derived (find exact keys), remove original (exact key), remove DB row
  const handleDelete = async (job) => {
    setError(null);

    // determine image key to remove; prefer DB row path if present
    const imagePath = job.dbRow?.path ?? job.id;
    if (!imagePath) return;
    if (!window.confirm(`Delete ${imagePath} and all derived variants? This cannot be undone.`)) return;

    updateJob(job.id, { status: "deleting", error: null });

    try {
      const base = imagePath.replace(/\.[^/.]+$/, "");
      console.log("🔍 base filename for match:", base);

      // 1) Build list of derived keys to delete by scanning each size folder
      const derivedToDelete = [];
      for (const size of SIZES) {
        const { data: items, error: listErr } = await supabase.storage.from("photos-derived").list(size, { limit: 2000 });
        if (listErr) {
          console.warn(`photos-derived list ${size} error:`, listErr);
          continue;
        }
        if (!items) continue;
        for (const item of items) {
          // item.name may be filename only; stored path is `${size}/${item.name}`
          const candidateKey = item.name.startsWith(`${size}/`) ? item.name : `${size}/${item.name}`;
          if (item.name.includes(base) || candidateKey.includes(base) || item.name.startsWith(base)) {
            derivedToDelete.push(candidateKey);
          }
        }
      }

      console.log("📂 derived files found to delete:", derivedToDelete);

      if (derivedToDelete.length > 0) {
        const { data: delDerivedRes, error: delDerivedErr } = await supabase.storage.from("photos-derived").remove(derivedToDelete);
        console.log("✅ derived delete result:", { delDerivedRes, delDerivedErr });
        if (delDerivedErr) {
          console.error("❌ delete derived error:", delDerivedErr);
          updateJob(job.id, { error: `Derived delete error: ${delDerivedErr.message || JSON.stringify(delDerivedErr)}` });
        }
      } else {
        console.log("ℹ️ no derived files matched for", base);

        // fallback: attempt candidate combos (size/ext)
        const candidatePaths = [];
        for (const size of SIZES) {
          for (const fmt of FORMATS) {
            candidatePaths.push(`${size}/${base}.${fmt}`);
          }
        }
        console.log("⚠️ fallback candidate delete attempt:", candidatePaths.slice(0, 12));
        const { data: delFallbackData, error: delFallbackErr } = await supabase.storage.from("photos-derived").remove(candidatePaths);
        console.log("fallback derived delete result:", { delFallbackData, delFallbackErr });
        if (delFallbackErr) {
          console.warn("fallback delete returned error:", delFallbackErr);
        }
      }

      // 2) Delete original: find exact key (list top-level originals)
      const { data: originals, error: origListErr } = await supabase.storage.from("photos-original").list("", { limit: 2000 });
      if (origListErr) {
        console.warn("photos-original list error:", origListErr);
      } else {
        console.log("📂 current originals (sample):", originals?.slice?.(0, 10) ?? originals);
      }

      // find file whose name equals imagePath or contains imagePath
      let matchKey = null;
      if (Array.isArray(originals)) {
        const found = originals.find((o) => o.name === imagePath || o.name.endsWith(`/${imagePath}`) || o.name.includes(imagePath));
        if (found) matchKey = found.name;
      }

      if (!matchKey) {
        // fallback to top-level
        const { data: topLevel, error: topErr } = await supabase.storage.from("photos-original").list("", { limit: 2000 });
        if (!topErr && Array.isArray(topLevel)) {
          const found2 = topLevel.find((o) => o.name === imagePath);
          if (found2) matchKey = found2.name;
        }
      }

      if (matchKey) {
        console.log("📂 deleting original key:", matchKey);
        const { data: delOrigData, error: delOrigErr } = await supabase.storage.from("photos-original").remove([matchKey]);
        console.log("✅ original delete result:", { delOrigData, delOrigErr });
        if (delOrigErr) {
          console.error("❌ delete original error:", delOrigErr);
          updateJob(job.id, { error: `Original delete error: ${delOrigErr.message || JSON.stringify(delOrigErr)}` });
        }
      } else {
        console.warn("⚠️ original key not found for:", imagePath);
      }

      // 3) Delete DB row by exact path if present
      const dbPathToDelete = matchKey ?? imagePath;
      console.log("📂 deleting DB row with path:", dbPathToDelete);
      const { data: delRowData, error: dbErr } = await supabase.from("images").delete().eq("path", dbPathToDelete);
      if (dbErr) {
        console.error("❌ delete DB row error:", dbErr);
        updateJob(job.id, { error: `DB delete error: ${dbErr.message || JSON.stringify(dbErr)}` });
      } else {
        console.log("✅ DB row delete result:", delRowData);
      }

      // After all attempts, re-list buckets and log for confirmation
      const { data: checkDerived } = await supabase.storage.from("photos-derived").list("", { limit: 2000 });
      const { data: checkOriginals } = await supabase.storage.from("photos-original").list("", { limit: 2000 });
      console.log("Post-delete check - derived (sample):", checkDerived?.slice?.(0, 10) ?? checkDerived);
      console.log("Post-delete check - originals (sample):", checkOriginals?.slice?.(0, 10) ?? checkOriginals);

      // Update UI: remove job
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      // optionally reload listing for full view
      await loadImagesAndDerived();
    } catch (err) {
      console.error("❌ unexpected delete error:", err);
      updateJob(job.id, { status: "error", error: err?.message ?? String(err) });
    }
  };

  if (loadingAuth) return <p>Logging in as admin...</p>;

  return (
    <>
      <Nav />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>

        {error && (
          <div className="error" style={{ color: "red", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <input type="file" multiple onChange={handleFilesChange} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <button onClick={handleUploadAll} disabled={!files.length || isUploading}>
            {isUploading ? "Uploading..." : `Upload ${files.length ? `(${files.length})` : ""}`}
          </button>

          <button onClick={loadImagesAndDerived}>Refresh</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {jobs.length === 0 && <p>No uploads / images found.</p>}
          {jobs.map((job) => (
            <div key={job.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{job.name}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>{job.status}</div>
                  {job.dbRow && <div style={{ fontSize: 12, color: "#666" }}>DB: {job.dbRow.path}</div>}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleDelete(job)}>Delete</button>
                </div>
              </div>

              {job.derived?.length > 0 && (
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
}
