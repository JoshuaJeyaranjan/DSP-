import React, { useState, useEffect } from "react";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./AdminVideoPage.scss";
import { toEmbedUrl } from "../../utils/youtube";

const API_BASE = "https://youtube-service-6nd9.onrender.com/api";
const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";

export default function AdminVideoPage() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [videos, setVideos] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryThumbnail, setCategoryThumbnail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // ---------------------------
  // Categories
  // ---------------------------
const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json(); // already [{name, categoryThumbnail}, ...]

    console.log("Fetched categories:", data);

    setCategories(data); // <- use directly
    if (!category && data.length > 0) setCategory(data[0].name);
  } catch (err) {
    console.error("Error fetching categories:", err);
    setError(err.message);
  }
};

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return setError("Category name required");
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      await fetchCategories();
      setNewCategory("");
      setMessage("Category added successfully!");
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`Delete category "${catName}" and all its videos?`)) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catName}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      await fetchCategories();
      if (category === catName) {
        setCategory("");
        setVideos([]);
        setCategoryThumbnail("");
      }
      setMessage(`Category "${catName}" deleted successfully!`);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.message);
    }
  };

  const handleUpdateCategoryThumbnail = async () => {
    if (!categoryThumbnail.trim()) return setError("Thumbnail URL required");
    try {
      const res = await fetch(`${API_BASE}/categories/${category}/thumbnail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: categoryThumbnail }),
      });
      if (!res.ok) throw new Error("Failed to update category thumbnail");
      setMessage("Category thumbnail updated successfully!");
    } catch (err) {
      console.error("Error updating category thumbnail:", err);
      setError(err.message);
    }
  };

  // ---------------------------
  // Videos
  // ---------------------------
  const fetchVideos = async (catName) => {
    if (!catName) return;
    try {
      const res = await fetch(`${API_BASE}/videos/${catName}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error(`Error fetching videos for category "${catName}":`, err);
      setError(err.message);
    }
  };

  const handleAddVideo = async () => {
    if (!title.trim() || !url.trim()) return setError("Title and URL required");
    const embedUrl = toEmbedUrl(url);
    if (!embedUrl) return setError("Invalid YouTube URL");

    try {
      const res = await fetch(`${API_BASE}/videos/${category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url: embedUrl }),
      });
      if (!res.ok) throw new Error("Failed to add video");
      const data = await res.json();
      setVideos(data.videos);
      setTitle("");
      setUrl("");
      setMessage("Video added successfully!");
    } catch (err) {
      console.error("Error adding video:", err);
      setError(err.message);
    }
  };

  const handleDeleteVideo = async (index) => {
    try {
      const res = await fetch(`${API_BASE}/videos/${category}/${index}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete video");
      const data = await res.json();
      setVideos(data.videos);
      setMessage("Video deleted successfully!");
    } catch (err) {
      console.error("Error deleting video:", err);
      setError(err.message);
    }
  };

  const handleUpdateVideoThumbnail = async (index, thumbUrl) => {
    if (!thumbUrl.trim()) return setError("Thumbnail URL required");
    try {
      const res = await fetch(`${API_BASE}/videos/${category}/${index}/thumbnail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: thumbUrl }),
      });
      if (!res.ok) throw new Error("Failed to update video thumbnail");
      setMessage("Video thumbnail updated successfully!");
      await fetchVideos(category);
    } catch (err) {
      console.error("Error updating video thumbnail:", err);
      setError(err.message);
    }
  };

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVideos(category);
  }, [category]);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <>
      <Nav />
      <div className="video-admin-page">
        <h1>Video Admin Dashboard</h1>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {/* Category Management */}
        <div className="category-controls">
          <h2>Manage Categories</h2>
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleAddCategory}>Add Category</button>
<ul>
  {categories.map((cat, idx) => {
    // Defensive: handle both strings or objects
    const name = typeof cat === "string" ? cat : cat.name;
    const thumbnail = cat.categoryThumbnail || "";

    

    return (
      <li key={`${name}-${idx}`}>
        <span
          style={{ cursor: "pointer", fontWeight: category === name ? "bold" : "normal" }}
          onClick={() => setCategory(name)}
        >
          {name} {/* <-- Only render the string */}
        </span>
        <button className="delete-category" onClick={() => handleDeleteCategory(name)}>
          Delete
        </button>
      </li>
    );
  })}
</ul>

          {/* Category Thumbnail */}
          {category && (
            <div className="category-thumbnail-control">
              <h3>Category Thumbnail</h3>
              <input
                type="text"
                placeholder="Paste thumbnail URL"
                value={categoryThumbnail}
                onChange={(e) => setCategoryThumbnail(e.target.value)}
              />
              <button onClick={handleUpdateCategoryThumbnail}>Update Thumbnail</button>
              {categoryThumbnail && (
                <img
                  src={categoryThumbnail || DEFAULT_THUMB}
                  alt={`${category} thumbnail`}
                  onError={(e) => (e.currentTarget.src = DEFAULT_THUMB)}
                />
              )}
            </div>
          )}
        </div>

        {/* Video Management */}
        {category && (
          <>
            <h2>Videos in {category}</h2>
            <div className="controls">
              <input
                type="text"
                placeholder="Video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="YouTube link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button onClick={handleAddVideo}>Add Video</button>
            </div>

            <div className="video-list">
              {videos.length === 0 && <p>No videos in this category.</p>}
              {videos.map((v, idx) => {
                const videoKey = v.url || idx; // unique key fallback
                return (
                  <div key={videoKey} className="video-item">
                    <div className="video-title">{v.title}</div>
                    <iframe
                      src={toEmbedUrl(v.url)}
                      title={v.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <div className="thumbnail-control">
                      <input
                        type="text"
                        placeholder="Video thumbnail URL"
                        defaultValue={v.thumbnail || ""}
                        id={`thumb-input-${idx}`}
                      />
                      <button
                        onClick={() => {
                          const val = document.getElementById(`thumb-input-${idx}`).value;
                          handleUpdateVideoThumbnail(idx, val);
                        }}
                      >
                        Update Thumbnail
                      </button>
                      {v.thumbnail && (
                        <img
                          src={v.thumbnail || DEFAULT_THUMB}
                          alt={`${v.title} thumbnail`}
                          onError={(e) => (e.currentTarget.src = DEFAULT_THUMB)}
                        />
                      )}
                    </div>
                    <button onClick={() => handleDeleteVideo(idx)}>Delete</button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}