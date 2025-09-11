// HomePage.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./HomePage.scss";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import Footer from "../../Components/Footer/Footer";

// env (Vite)
const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;

const supabase = createClient(PROJECT_URL, ANON_KEY);

// sizes & fallback extensions to probe
const PREFERRED_SIZE = "medium";
const FALLBACK_EXTS = ["avif", "webp", "jpg", "jpeg", "png"];

export default function HomePage() {
  const [heroUrl, setHeroUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadHero = async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) Try to get a DB row with is_home_hero
        const { data: rows, error: dbErr } = await supabase
          .from("images")
          .select("*")
          .eq("is_home_hero", true)
          .limit(1)
          .maybeSingle();

        if (dbErr) {
          console.warn("Supabase images read error:", dbErr);
        }

        // If we have a row, attempt to find a derived medium image that matches its base name
        let chosenUrl = null;
        let row = rows ?? null;

        if (row && row.path) {
          const base = row.path.replace(/\.[^/.]+$/, ""); // filename without extension

          // 2) Try to list "medium" folder and find an item that contains base
          const { data: mediumItems, error: listErr } = await supabase.storage
            .from("photos-derived")
            .list(PREFERRED_SIZE, { limit: 2000 });

          if (listErr) {
            console.warn("photos-derived list error:", listErr);
          } else if (Array.isArray(mediumItems) && mediumItems.length) {
            // item.name is usually the filename; build candidate full path: `${PREFERRED_SIZE}/${item.name}`
            const foundKey = mediumItems.find((it) => {
              // some names might keep base or include hash; match contains base
              const candidate = it.name;
              return candidate.includes(base);
            });

            if (foundKey) {
              const fullPath = `${PREFERRED_SIZE}/${foundKey.name}`;
              const { data } = supabase.storage.from("photos-derived").getPublicUrl(fullPath);
              chosenUrl = data?.publicUrl ?? null;
            }
          }

          // 3) Fallback: probe candidate names (size + ext combos)
          if (!chosenUrl) {
            for (const ext of FALLBACK_EXTS) {
              const candidate = `${PREFERRED_SIZE}/${base}.${ext}`;
              const { data } = supabase.storage.from("photos-derived").getPublicUrl(candidate);
              // getPublicUrl returns a URL regardless; verify presence by attempting a HEAD fetch.
              if (data?.publicUrl) {
                try {
                  // quick check — use fetch HEAD to verify file exists
                  const head = await fetch(data.publicUrl, { method: "HEAD" });
                  if (head.ok) {
                    chosenUrl = data.publicUrl;
                    break;
                  }
                } catch (e) {
                  // network or CORS may prevent HEAD — continue to next fallback
                  // we'll still treat a getPublicUrl as a candidate if listing failed entirely
                }
              }
            }
          }

          // 4) If still no derived, fall back to original file in photos-original (public url)
          if (!chosenUrl) {
            const origPath = row.path;
            const { data } = supabase.storage.from("photos-original").getPublicUrl(origPath);
            chosenUrl = data?.publicUrl ?? null;
          }
        } // end if row

        // 5) If no DB row exists or no URL found, optionally fall back to a static local hero
        if (!row || !chosenUrl) {
          // Replace this with your desired local fallback hero path or leave null to use CSS fallback
          const localFallback = "/photoAssets/home-hero.avif";
          chosenUrl = localFallback;
        }

        if (mounted) setHeroUrl(chosenUrl);
      } catch (error) {
        console.error("Error loading hero image:", error);
        if (mounted) setErr(error?.message ?? "Failed to load hero");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHero();
    return () => {
      mounted = false;
    };
  }, []);

  const backgroundStyle = heroUrl
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${heroUrl}")` }
    : {};

  return (
    <>
      <Nav overlay />
      <section className="home" style={backgroundStyle} aria-label="Homepage hero">
        <div className="home__overlay" /> {/* keeps textual contrast and theme overlay */}
        <div className="home__content">
          {loading ? (
            <p>Loading...</p>
          ) : err ? (
            <p className="error">Hero load error: {err}</p>
          ) : null}

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
