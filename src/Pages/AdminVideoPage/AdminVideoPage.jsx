import React, { useState, useEffect } from "react";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./AdminVideoPage.scss";
import { createClient } from "@supabase/supabase-js";
import { toEmbedUrl } from "../../utils/youtube";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);
const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";

export default function AdminVideoPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [categoryThumbnail, setCategoryThumbnail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // ---------------------------
  // Fetch categories
  // ---------------------------
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCategories(data);

      if (!selectedCategory && data.length > 0) {
        setSelectedCategory(data[0]);
        setCategoryThumbnail(data[0].thumbnail_url || "");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // ---------------------------
  // Fetch videos for selected category
  // ---------------------------
  const fetchVideos = async (categoryId) => {
    if (!categoryId) return;

    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setVideos([]);
    }
  };

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchVideos(selectedCategory.id);
      setCategoryThumbnail(selectedCategory.thumbnail_url || "");
    } else {
      setVideos([]);
      setCategoryThumbnail("");
    }
  }, [selectedCategory]);

  // ---------------------------
  // Category Handlers
  // ---------------------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return setError("Category name required");

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;
      setNewCategoryName("");
      setMessage("Category added successfully!");
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete category and all its videos?")) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw error;

      setMessage("Category deleted successfully!");
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleUpdateCategoryThumbnail = async () => {
    if (!categoryThumbnail.trim()) return setError("Thumbnail URL required");

    try {
      const { error } = await supabase
        .from("categories")
        .update({ thumbnail_url: categoryThumbnail })
        .eq("id", selectedCategory.id);

      if (error) throw error;

      setMessage("Category thumbnail updated!");
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // ---------------------------
  // Video Handlers
  // ---------------------------
  const handleAddVideo = async () => {
    if (!selectedCategory) return setError("Select a category first");
    if (!title.trim() || !url.trim()) return setError("Title and URL required");

    const embedUrl = toEmbedUrl(url);
    if (!embedUrl) return setError("Invalid YouTube URL");

    try {
      const { data, error } = await supabase
        .from("videos")
        .insert([{ title, url: embedUrl, category_id: selectedCategory.id }])
        .select()
        .single();

      if (error) throw error;

      setVideos((prev) => [...prev, data]);
      setTitle("");
      setUrl("");
      setMessage("Video added successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;

    try {
      const { error } = await supabase.from("videos").delete().eq("id", videoId);
      if (error) throw error;

      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      setMessage("Video deleted successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleUpdateVideoThumbnail = async (videoId, thumbUrl) => {
    if (!thumbUrl.trim()) return setError("Thumbnail URL required");

    try {
      const { error } = await supabase
        .from("videos")
        .update({ thumbnail_url: thumbUrl })
        .eq("id", videoId);

      if (error) throw error;
      setMessage("Video thumbnail updated!");
      fetchVideos(selectedCategory.id);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

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
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button onClick={handleAddCategory}>Add Category</button>

          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>
                <span
                  style={{
                    color: "rgba(0,0,0,1)", 
                    cursor: "pointer",
                    fontWeight: selectedCategory?.id === cat.id ? "bold" : "normal",
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.name}
                </span>
                <button className="delete-category" onClick={() => handleDeleteCategory(cat.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {selectedCategory && (
            <div className="category-thumbnail-control">
              <h3>Category Thumbnail</h3>
              <input
                type="text"
                placeholder="Thumbnail URL"
                value={categoryThumbnail}
                onChange={(e) => setCategoryThumbnail(e.target.value)}
              />
              <button onClick={handleUpdateCategoryThumbnail}>Update Thumbnail</button>
              {categoryThumbnail && (
                <img
                  src={categoryThumbnail || DEFAULT_THUMB}
                  alt={`${selectedCategory.name} thumbnail`}
                  onError={(e) => (e.currentTarget.src = DEFAULT_THUMB)}
                />
              )}
            </div>
          )}
        </div>

        {/* Video Management */}
        {selectedCategory && (
          <>
            <h2>Videos in {selectedCategory.name}</h2>
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
              {videos.map((v) => (
                <div key={v.id} className="video-item">
                  <div className="video-title">{v.title}</div>
                  <iframe
                    src={toEmbedUrl(v.url)}
                    title={v.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button onClick={() => handleDeleteVideo(v.id)}>Delete</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}