import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./VideoHubPage.scss";
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const SERVER_URL = "https://youtube-service-6nd9.onrender.com";
const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";

const supabase = createClient(PROJECT_URL, ANON_KEY);

function VideoHubPage() {
  const [categories, setCategories] = useState([]);
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState({ categories: true, hero: true });
  const [error, setError] = useState({ categories: null, hero: null });
  const [loadedHero, setLoadedHero] = useState(false); // fade-in effect

  useEffect(() => {
    let mounted = true;

    // -----------------------------
    // Fetch categories
    // -----------------------------
    const fetchCategories = async () => {
      setLoading((prev) => ({ ...prev, categories: true }));
      try {
        const res = await fetch(`${SERVER_URL}/api/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        const categoryArr = data.map((cat) => ({
          name: cat.name,
          path: `/video/${cat.name}`,
          thumbnail: cat.categoryThumbnail || DEFAULT_THUMB,
        }));

        if (mounted) setCategories(categoryArr);
      } catch (err) {
        console.error("Error fetching categories:", err);
        if (mounted) setError((prev) => ({ ...prev, categories: err.message }));
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, categories: false }));
      }
    };

    // -----------------------------
    // Fetch hero image (photo logic style)
    // -----------------------------
    const fetchHero = async () => {
      setLoading((prev) => ({ ...prev, hero: true }));
      setError((prev) => ({ ...prev, hero: null }));

      try {
        const { data: row, error } = await supabase
          .from("images")
          .select("path")
          .eq("is_video_hero", true)
          .maybeSingle();

        if (error) {
          console.warn("Supabase hero fetch error:", error);
          if (mounted) setError((prev) => ({ ...prev, hero: error.message }));
          return;
        }

        if (row?.path && mounted) {
          const { data: pubData } = supabase.storage
            .from("photos-original")
            .getPublicUrl(row.path);

          if (pubData?.publicUrl) {
            setHeroUrl(pubData.publicUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching hero:", err);
        if (mounted) setError((prev) => ({ ...prev, hero: err.message }));
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, hero: false }));
      }
    };

    fetchCategories();
    fetchHero();

    return () => {
      mounted = false;
    };
  }, []);

  const handleHeroLoad = () => {
    setLoadedHero(true);
  };

  const backgroundStyle = heroUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${heroUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }
    : {};

  // -----------------------------
  // Render
  // -----------------------------
  if (loading.categories) return <p>Loading video categories...</p>;
  if (error.categories) return <p>Error: {error.categories}</p>;
  if (!categories.length) return <p>No video categories found.</p>;

  return (
    <>
      <Nav />

      <div className="video-hub-page">
        <section
          className={`hero ${loadedHero ? "loaded" : ""}`}
          style={backgroundStyle}
          aria-label="Video hero"
        >
          {!loadedHero && <div className="hero-skeleton" />}
          {heroUrl && (
            <img
              src={heroUrl}
              alt="Video hero preload"
              onLoad={handleHeroLoad}
              style={{ display: "none" }}
            />
          )}
          <div className="overlay" />
          {loading.hero && <p>Loading hero...</p>}
          {error.hero && <p className="error">Hero load error: {error.hero}</p>}
          <h1 className="title">Film</h1>
        </section>

        <div className="video-categories">
          {categories.map((cat) => (
            <Link key={cat.name} to={cat.path} className="video-category-card">
              {loading.categories ? (
                <div className="thumb-skeleton" />
              ) : (
                <img
                  src={cat.thumbnail}
                  alt={`${cat.name} thumbnail`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.currentTarget.src = DEFAULT_THUMB)}
                />
              )}
              <span className="category-title">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default VideoHubPage;