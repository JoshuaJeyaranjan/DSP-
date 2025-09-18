import React, { useEffect, useState } from "react";
import "./AboutPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { getAssetsByType } from "../../utils/assets";

function AboutPage() {
  const [headshot, setHeadshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHeadshot() {
      try {
        // Fetch only the main headshot for About page
        const data = await getAssetsByType("about", "main_headshot");
        setHeadshot(data);
      } catch (err) {
        console.error("Error fetching about headshot:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHeadshot();
  }, []);

  if (loading) return <p>Loading About Page...</p>;

  return (
    <>
      <Nav />
      <div className="about-page">
        <div className="about-hero">
          <h1 className="about-title">DEMETRIOS SACLAMACIS</h1>
        </div>

        <div className="about-content">
          <div className="about-section">
            <img
              src={headshot?.url || "/photoAssets/about-placeholder.avif"}
              alt={headshot?.alt_text || "Videographer profile"}
              className="about-image"
              onError={(e) =>
                (e.currentTarget.src = "/photoAssets/about-placeholder.avif")
              }
            />
            <div className="about-text">
              <p>
                I started filming five years ago, experimenting with short films
                and music videos. Since then, I’ve grown into a full-fledged
                videographer working with clients across various industries.
              </p>
              <p>
                I’m a passionate videographer specializing in capturing moments
                that tell a story. From landscapes to events, my goal is to make
                every frame memorable.
              </p>
              <p>
                Every project is unique. I strive to understand the vision of my
                clients and translate it into stunning visual narratives that
                resonate.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default AboutPage;