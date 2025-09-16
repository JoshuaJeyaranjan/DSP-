import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import "./PhotoHubPage.scss";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];
const PREFERRED_SIZE = "medium";

export default function PhotoHub() {
  const [thumbnails, setThumbnails] = useState({});
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState({ thumbnails: true, hero: true });
  const [error, setError] = useState({ thumbnails: null, hero: null });
  const [loadedHero, setLoadedHero] = useState(false); // fade-in effect

  // -----------------------------
  // Load thumbnails in parallel
  // -----------------------------
  useEffect(() => {
    const fetchThumbnails = async () => {
      setLoading(prev => ({ ...prev, thumbnails: true }));
      setError(prev => ({ ...prev, thumbnails: null }));

      try {
        const thumbPromises = CATEGORIES.map(async category => {
          const { data: image, error: fetchErr } = await supabase
            .from("images")
            .select("path")
            .eq("category", category)
            .eq("thumbnail", true)
            .limit(1)
            .maybeSingle();

          if (fetchErr) {
            console.warn(`Error fetching thumbnail for ${category}:`, fetchErr);
            return [category, null];
          }

          if (!image?.path) return [category, null];

          const { data: pubData } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(`${PREFERRED_SIZE}/${image.path.replace(/\.[^/.]+$/, ".webp")}`);

          return [category, pubData?.publicUrl ?? null];
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
  }, []);

  // -----------------------------
  // Load hero image with fade-in
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const fetchHero = async () => {
      setLoading(prev => ({ ...prev, hero: true }));
      setError(prev => ({ ...prev, hero: null }));

      try {
        const { data: row, error } = await supabase
          .from("images")
          .select("path")
          .eq("is_photo_hero", true)
          .maybeSingle();

        if (error) {
          console.warn("Supabase hero fetch error:", error);
          if (mounted) setError(prev => ({ ...prev, hero: error.message }));
          return;
        }

        if (row?.path && mounted) {
          const { data: pubData } = supabase.storage
            .from("photos-original")
            .getPublicUrl(row.path);
          if (pubData?.publicUrl) setHeroUrl(pubData.publicUrl);
        }
      } catch (err) {
        console.error("Error fetching hero:", err);
        if (mounted) setError(prev => ({ ...prev, hero: err.message }));
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, hero: false }));
      }
    };

    fetchHero();
    return () => { mounted = false; };
  }, []);

  const handleHeroLoad = () => setLoadedHero(true);

  const backgroundStyle = heroUrl
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${heroUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }
    : {};

  if (loading.thumbnails) return <p className="loading-text">Loading thumbnails...</p>;
  if (error.thumbnails) return <p className="error">{error.thumbnails}</p>;

  return (
    <>
      <Nav />
      <div className="photo-hub-page">
        <section className={`hero ${loadedHero ? "loaded" : ""}`} style={backgroundStyle} aria-label="">
          {!loadedHero && <div className="hero-skeleton" />}
          {heroUrl && <img src={heroUrl} alt="Photo hero" onLoad={handleHeroLoad} style={{ display: "none" }} />}
          <div className="overlay" />
          {loading.hero && <p>Loading hero...</p>}
          {error.hero && <p className="error">Hero load error: {error.hero}</p>}
          <h1 className="title">STILLS</h1>
        </section>

        <div className="photo-categories">
          {CATEGORIES.map(cat => (
            <div key={cat} className="photo-category-card">
              <h2 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h2>
              {thumbnails[cat] ? (
                <Link to={`/photography/${cat}`} className="thumb-link">
                  <div className="thumb-wrapper">
                    <img
                      src={thumbnails[cat]}
                      alt={`${cat} thumbnail`}
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