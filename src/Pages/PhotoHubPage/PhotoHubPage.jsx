import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom"; // assuming you're using react-router
import "./PhotoHubPage.scss";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;

const supabase = createClient(PROJECT_URL, ANON_KEY);
const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];

export default function PhotoHub() {
  const [thumbnails, setThumbnails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadThumbnails = async () => {
      setLoading(true);
      setError(null);

      try {
        const thumbs = {};
        for (const category of CATEGORIES) {
          const { data: image, error: fetchErr } = await supabase
            .from("images")
            .select("path, bucket")
            .eq("category", category)
            .eq("thumbnail", true)
            .limit(1)
            .maybeSingle();

          if (fetchErr) {
            console.error(`Error fetching thumbnail for ${category}:`, fetchErr);
            setError(`Error fetching thumbnail for ${category}`);
            continue;
          }

          if (!image) {
            thumbs[category] = null;
            continue;
          }

          const base = image.path.replace(/\.[^/.]+$/, "");
          const derivedPath = `medium/${base}.webp`;
          const { data: pub } = supabase.storage.from("photos-derived").getPublicUrl(derivedPath);

          thumbs[category] = pub?.publicUrl ?? null;
        }

        setThumbnails(thumbs);
      } catch (err) {
        console.error("loadThumbnails error:", err);
        setError("Failed to load thumbnails");
      } finally {
        setLoading(false);
      }
    };

    loadThumbnails();
  }, []);

  if (loading) return <p className="loading-text">Loading thumbnails...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <Nav />
      <div className="photo-hub-page">
        <h1 className="hub-title">Photo Categories</h1>
        <div className="category-grid">
    {CATEGORIES.map(cat => (
  <div key={cat} className="category-card">
    <h2 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h2>
    {thumbnails[cat] ? (
      <Link to={`/photography/${cat}`} className="thumb-link">
        <div className="thumb-wrapper">
          <img src={thumbnails[cat]} alt={`${cat} thumbnail`} className="category-thumb" />
        </div>
      </Link>
    ) : (
      <div className="no-thumb">No thumbnail assigned</div>
    )}
  </div>
))}
        </div>
      </div>
    </>
  );
}