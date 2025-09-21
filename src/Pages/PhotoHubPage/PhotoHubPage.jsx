import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import "./PhotoHubPage.scss";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

const CATEGORIES = ["car", "sports", "drone", "portrait", "product"];
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

  const [thumbnails, setThumbnails] = useState({});
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState({ thumbnails: true, hero: true });
  const [error, setError] = useState({ thumbnails: null, hero: null });
  const [loadedHero, setLoadedHero] = useState(false);

  // -----------------------------
  // Load thumbnails
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

          if (fetchErr || !image?.path) return [category, null];

          const { data: pubData } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(`${THUMBNAIL_SIZE}/${image.path.replace(/\.[^/.]+$/, ".webp")}`);

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
// Load hero image with AVIF + WebP fallback
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

      if (error) throw error;

      if (row?.path && mounted) {
        const heroFolder = heroSize; // 'large' or 'medium'
        const baseFilename = row.path.split("/").pop().replace(/\.[^/.]+$/, "");

        // AVIF first
        const avifPath = `${heroFolder}/${baseFilename}.avif`;
        const { data: avifData } = supabase.storage
          .from("photos-derived")
          .getPublicUrl(avifPath);

        if (avifData?.publicUrl) {
          setHeroUrl(avifData.publicUrl);
        } else {
          // Fallback to WebP
          const webpPath = `${heroFolder}/${baseFilename}.webp`;
          const { data: webpData } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(webpPath);

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
  return () => { mounted = false; };
}, [heroSize]); // refetch whenever heroSize changes
  const handleHeroLoad = () => setLoadedHero(true);

  const backgroundStyle = heroUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${heroUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }
    : {};

  if (loading.thumbnails) return <PageLoader />;
  if (error.thumbnails) return <p className="error">{error.thumbnails}</p>;

  return (
    <>
      <Nav overlay />
      <div className="photo-hub-page">
        <section className={`hero ${loadedHero ? "loaded" : ""}`} style={backgroundStyle}>
          {!loadedHero && <div className="hero-skeleton" />}
          {heroUrl && <img src={heroUrl} alt="Photo hero" onLoad={handleHeroLoad} style={{ display: "none" }} />}
          <div className="overlay" />
          {loading.hero && <PageLoader />}
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