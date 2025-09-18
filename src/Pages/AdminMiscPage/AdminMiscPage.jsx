// AdminMiscPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient"; // <-- anon client
import "./AdminMiscPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

const TYPES = ["about", "contact", "logos"];

export default function AdminMiscPage() {
  const [activeType, setActiveType] = useState("about");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ----------------------
  // Fetch files
  // ----------------------
  const fetchFiles = async (type) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.storage
        .from("misc")
        .list(type, { limit: 100 });
      if (error) throw error;

      const filesWithUrls = data.map((file) => ({
        name: file.name,
        url: supabase.storage
          .from("misc")
          .getPublicUrl(`${type}/${file.name}`).data.publicUrl,
        updatedAt: file.updated_at,
      }));

      setFiles(filesWithUrls);
    } catch (err) {
      console.error("[AdminMiscPage] Fetch error:", err);
      setError(err.message || "Failed to fetch files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // On mount or type change
  // ----------------------
  useEffect(() => {
    fetchFiles(activeType);
  }, [activeType]);

  // ----------------------
  // Upload file
  // ----------------------
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const filePath = `${activeType}/${Date.now()}-${file.name}`;

    try {
      const { error } = await supabase.storage
        .from("misc")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;

      const publicUrl = supabase.storage
        .from("misc")
        .getPublicUrl(filePath).data.publicUrl;

      setFiles((prev) => [
        ...prev,
        { name: file.name, url: publicUrl, updatedAt: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error("[AdminMiscPage] Upload error:", err);
      setError(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // ----------------------
  // Delete file
  // ----------------------
  const handleDelete = async (name) => {
    if (!window.confirm(`Delete ${name}?`)) return;

    try {
      const { error } = await supabase.storage
        .from("misc")
        .remove([`${activeType}/${name}`]);
      if (error) throw error;

      setFiles((prev) => prev.filter((f) => f.name !== name));
    } catch (err) {
      console.error("[AdminMiscPage] Delete error:", err);
      setError(err.message || "Failed to delete file");
    }
  };

  // ----------------------
  // Copy URL
  // ----------------------
  const handleCopyUrl = (url) =>
    navigator.clipboard.writeText(url).then(() => alert("URL copied!"));

  // ----------------------
  // Render
  // ----------------------
  return (
    <>
      <Nav />
      <div className="admin-misc-page">
        <h1>Admin Miscellaneous Media Dashboard</h1>
        {error && <div className="error">{error}</div>}

        {/* Type Tabs */}
        <div className="type-tabs">
          {TYPES.map((type) => (
            <button
              key={type}
              className={activeType === type ? "active" : ""}
              onClick={() => setActiveType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <input type="file" onChange={handleUpload} />
        </div>

        {/* Files Grid */}
        <div className="file-grid">
          {loading ? (
            <p>Loading files...</p>
          ) : files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            files.map((f) => (
              <div key={f.name} className="file-card">
                <img src={f.url} alt={f.name} />
                <div className="file-meta">
                  <p>{f.name}</p>
                  <p>{new Date(f.updatedAt).toLocaleString()}</p>
                </div>
                <div className="file-actions">
                  <button onClick={() => handleCopyUrl(f.url)}>Copy URL</button>
                  <button onClick={() => handleDelete(f.name)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}