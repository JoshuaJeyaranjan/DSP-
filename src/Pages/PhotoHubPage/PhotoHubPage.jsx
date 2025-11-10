// src/Layouts/PhotoHubPage.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import "./PhotoHubPage.scss";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

const THUMBNAIL_SIZE = "medium";
const HERO_LARGE_BREAKPOINT = 1024; // px

// Hook to track window width
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

export default function PhotoHub() {
  const windowWidth = useWindowWidth();
  const heroSize = windowWidth >= HERO_LARGE_BREAKPOINT ? "large" : "medium";

  const [categories, setCategories] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState({ categories: true, thumbnails: true, hero: true });
  const [error, setError] = useState({ categories: null, thumbnails: null, hero: null });
  const [loadedHero, setLoadedHero] = useState(false);

  // -----------------------------
  // Load categories from DB
  // -----------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(prev => ({ ...prev, categories: true }));
      try {
        const { data, error } = await supabase
          .from("image_categories")
          .select("id, name, thumbnail_url, slug")
          .eq("visible_on_hub", true)
          .order("name");

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(prev => ({ ...prev, categories: "Failed to fetch categories" }));
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, []);

  // -----------------------------
  // Load thumbnails for categories
  // -----------------------------
  useEffect(() => {
    if (categories.length === 0) return;

    const fetchThumbnails = async () => {
      setLoading(prev => ({ ...prev, thumbnails: true }));
      try {
        const thumbPromises = categories.map(async cat => {
          if (cat.thumbnail_url) {
            // If category has a stored thumbnail_url, just use it
            return [cat.name, cat.thumbnail_url];
          }

          // Otherwise, fallback: find a thumbnail image from images table
          const { data: image, error: fetchErr } = await supabase
            .from("images")
            .select("path")
            .eq("category_id", cat.id)
            .eq("thumbnail", true)
            .limit(1)
            .maybeSingle();

          if (fetchErr || !image?.path) return [cat.name, null];

          const { data: pubData } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(`${THUMBNAIL_SIZE}/${image.path.replace(/\.[^/.]+$/, ".webp")}`);

          return [cat.name, pubData?.publicUrl ?? null];
        });

        const results = await Promise.all(thumbPromises);
        setThumbnails(Object.fromEntries(results));
      } catch (err) {
        console.error("Failed to load thumbnails:", err);
        setError(prev => ({ ...prev, thumbnails: "Failed to load thumbnails" }));
      } finally {
        setLoading(prev => ({ ...prev, thumbnails: false }));
      }
    };

    fetchThumbnails();
  }, [categories]);

  // -----------------------------
  // Load hero image
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const fetchHero = async () => {
      setLoading(prev => ({ ...prev, hero: true }));
      try {
        const { data: row, error } = await supabase
          .from("images")
          .select("path")
          .eq("is_photo_hero", true)
          .maybeSingle();

        if (error) throw error;

        if (row?.path && mounted) {
          const heroFolder = heroSize; // 'large' or 'medium'
          const baseFilename = row.path.split("/").pop().replace(/\.[^/.]+$/, "");

          // AVIF first
          const avifPath = `${heroFolder}/${baseFilename}.avif`;
          const { data: avifData } = supabase.storage.from("photos-derived").getPublicUrl(avifPath);

          if (avifData?.publicUrl) {
            setHeroUrl(avifData.publicUrl);
          } else {
            // Fallback to WebP
            const webpPath = `${heroFolder}/${baseFilename}.webp`;
            const { data: webpData } = supabase.storage.from("photos-derived").getPublicUrl(webpPath);

            if (webpData?.publicUrl) setHeroUrl(webpData.publicUrl);
            else {
              console.warn("Hero image not found in AVIF or WebP:", avifPath, webpPath);
              setHeroUrl(null);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching hero:", err);
        if (mounted) setError(prev => ({ ...prev, hero: err.message }));
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, hero: false }));
      }
    };

    fetchHero();
    return () => {
      mounted = false;
    };
  }, [heroSize]);

  const handleHeroLoad = () => setLoadedHero(true);

  const backgroundStyle = heroUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${heroUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }
    : {};

  if (loading.categories || loading.thumbnails) return <PageLoader />;
  if (error.categories) return <p className="error">{error.categories}</p>;
  if (error.thumbnails) return <p className="error">{error.thumbnails}</p>;

  return (
    <>
      <Nav overlay />
      <div className="photo-hub-page">
        {/* Hero */}
        <section className={`hero ${loadedHero ? "loaded" : ""}`} style={backgroundStyle}>
          {!loadedHero && <div className="hero-skeleton" />}
          {heroUrl && <img src={heroUrl} alt="Photo hero" onLoad={handleHeroLoad} style={{ display: "none" }} />}
          <div className="overlay" />
          {loading.hero && <PageLoader />}
          {error.hero && <p className="error">Hero load error: {error.hero}</p>}
          <h1 className="title">STILLS</h1>
        </section>

        {/* Categories */}
        <div className="photo-categories">
          {categories.map(cat => (
            <div key={cat.id} className="photo-category-card">
              <h2 className="category-title">{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</h2>
              {thumbnails[cat.name] ? (
                <Link to={`/photography/${cat.slug}`} className="thumb-link">
                  <div className="thumb-wrapper">
                    <img
                      src={thumbnails[cat.name]}
                      alt={`${cat.name} thumbnail`}
                      className="category-thumb fade-in"
                      loading="lazy"
                    />
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