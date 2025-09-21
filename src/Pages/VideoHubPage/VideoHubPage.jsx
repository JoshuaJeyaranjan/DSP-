import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./VideoHubPage.scss";
import { createClient } from "@supabase/supabase-js";
import LoadingSkeleton from "../../Components/LoadingSkeleton/LoadingSkeleton";
import PageLoader from "../../Components/PageLoader/PageLoader";

const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";
const VIDEO_SERVICE_URL = "https://video-service-73ro.onrender.com";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

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

function VideoHubPage() {
    const windowWidth = useWindowWidth();
  const heroSize = windowWidth >= HERO_LARGE_BREAKPOINT ? "large" : "medium";
  const [categories, setCategories] = useState([]);
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState({ categories: true, hero: true });
  const [error, setError] = useState({ categories: null, hero: null });
  const [loadedHero, setLoadedHero] = useState(false); // fade-in effect


// -----------------------------
// Fetch categories (from Supabase)
// -----------------------------
useEffect(() => {
  let mounted = true;

  const fetchCategories = async () => {
    console.time("Fetch categories total");
    setLoading((prev) => ({ ...prev, categories: true }));
    setError((prev) => ({ ...prev, categories: null }));

    try {
      console.time("Supabase select categories");
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, thumbnail_url")
        .order("name", { ascending: true }); // alphabetical for nice UX
      console.timeEnd("Supabase select categories");

      if (error) throw error;

      if (data && mounted) {
        console.time("Transform categories array");
        const categoryArr = data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          path: `/video/${cat.id}`, // since no slug column, use id in URL
          thumbnail: cat.thumbnail_url || DEFAULT_THUMB,
        }));
        console.timeEnd("Transform categories array");

        setCategories(categoryArr);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      if (mounted) setError((prev) => ({ ...prev, categories: err.message }));
    } finally {
      if (mounted) setLoading((prev) => ({ ...prev, categories: false }));
      console.timeEnd("Fetch categories total");
    }
  };

  fetchCategories();
  return () => {
    mounted = false;
  };
}, []);

// -----------------------------
// Fetch hero image
// -----------------------------
useEffect(() => {
  let mounted = true;

  const fetchHero = async () => {
    console.time("Fetch hero total");
    setLoading((prev) => ({ ...prev, hero: true }));
    setError((prev) => ({ ...prev, hero: null }));

    try {
      console.time("Supabase select image");
      const { data: row, error } = await supabase
        .from("images")
        .select("path")
        .eq("is_video_hero", true)
        .maybeSingle();
      console.timeEnd("Supabase select image");

      if (error) throw error;

      if (row?.path && mounted) {
        console.time("Generate hero URL");
        const heroFolder = heroSize;
        const baseFilename = row.path.split("/").pop().replace(/\.[^/.]+$/, "");

        const avifPath = `${heroFolder}/${baseFilename}.avif`;
        const { data: avifData } = supabase.storage
          .from("photos-derived")
          .getPublicUrl(avifPath);

        if (avifData?.publicUrl) {
          setHeroUrl(avifData.publicUrl);
        } else {
          const webpPath = `${heroFolder}/${baseFilename}.webp`;
          const { data: webpData } = supabase.storage
            .from("photos-derived")
            .getPublicUrl(webpPath);

          if (webpData?.publicUrl) setHeroUrl(webpData.publicUrl);
          else {
            console.warn("Hero not found:", avifPath, webpPath);
            setHeroUrl(null);
          }
        }
        console.timeEnd("Generate hero URL");
      }
    } catch (err) {
      console.error("Error fetching hero:", err);
      if (mounted) setError((prev) => ({ ...prev, hero: err.message }));
    } finally {
      if (mounted) setLoading((prev) => ({ ...prev, hero: false }));
      console.timeEnd("Fetch hero total");
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

  // -----------------------------
  // Render
  // -----------------------------.
  if (loading.categories) return <PageLoader/>;
  if (error.categories) return <p>Error: {error.categories}</p>;
  if (!categories.length) return <p>No video categories found.</p>;

  return (
    <>
      <Nav overlay />
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
          {loading.hero && <PageLoader/>}
          {error.hero && <p className="error">Hero load error: {error.hero}</p>}
          <h1 className="title">Film</h1>
        </section>

        <div className="video-categories">
          {categories.map(cat => (
            <Link key={cat.name} to={cat.path} className="video-category-card">
              <img
                src={cat.thumbnail}
                alt={`${cat.name} thumbnail`}
                loading="lazy"
                decoding="async"
                onError={e => (e.currentTarget.src = DEFAULT_THUMB)}
              />
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