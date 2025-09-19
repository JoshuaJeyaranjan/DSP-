import React, { useEffect, useState } from "react";
import "./AboutPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

function AboutPage() {
  const [aboutImage, setAboutImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAboutImage() {
      try {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("is_about_image", true)
          .maybeSingle();

        if (error) throw error;
        setAboutImage(data);
      } catch (err) {
        console.error("Error fetching about image:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutImage();
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
              src={
                aboutImage
                  ? `${PROJECT_URL}/storage/v1/object/public/${aboutImage.bucket}/${aboutImage.path}`
                  : "/photoAssets/about-placeholder.avif"
              }
              alt={aboutImage?.title || "Videographer profile"}
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