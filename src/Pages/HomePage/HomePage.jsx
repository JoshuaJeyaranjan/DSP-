import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./HomePage.scss";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import Footer from "../../Components/Footer/Footer";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

export default function HomePage() {
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [loaded, setLoaded] = useState(false); // hero image fade-in

  useEffect(() => {
    let mounted = true;

    const loadHero = async () => {
      setLoading(true);
      setErr(null);

      try {
        const { data: row, error: dbErr } = await supabase
          .from("images")
          .select("path")
          .eq("is_home_hero", true)
          .maybeSingle();

        if (dbErr) console.warn("Supabase hero read error:", dbErr);

        if (mounted && row?.path) {
          const { data } = supabase.storage
            .from("photos-original")
            .getPublicUrl(row.path);
          setHeroUrl(data?.publicUrl ?? null);
        }
      } catch (error) {
        console.error("Error loading hero:", error);
        if (mounted) setErr(error?.message ?? "Failed to load hero");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHero();
    return () => { mounted = false; };
  }, []);

  const handleHeroLoad = () => setLoaded(true);

  return (
    <>
      <Nav overlay />
      <section
        className={`home ${loaded ? "loaded" : ""}`}
        style={{ backgroundImage: heroUrl ? `url("${heroUrl}")` : "none" }}
      >
        {!loaded && <div className="hero-skeleton" />} {/* Skeleton */}
        {heroUrl && (
          <img
            src={heroUrl}
            alt="Homepage hero"
            className="hero-img"
            onLoad={handleHeroLoad}
            style={{ display: "none" }} // hidden, only triggers onLoad
          />
        )}
        <div className="home__overlay" />
        <div className="home__content">
          {loading && <p>Loading...</p>}
          {err && <p className="error">{err}</p>}

          <h1 className="home__title">D|F|S V|S|ON</h1>
          <h3 className="home__subtitle">VIDEOGRAPHER & PHOTOGRAPHER</h3>

          <Link className="home__link" to="/photography">
            View Work
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}