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
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAboutData() {
      setLoading(true);
      try {
        // Fetch the "About" hero image
        const { data: imageData, error: imageError } = await supabase
          .from("images")
          .select("*")
          .eq("is_about_image", true)
          .maybeSingle();

        if (imageError) throw imageError;
        setAboutImage(imageData);

        // Fetch all paragraphs for the About section
        const { data: aboutParagraphs, error: paragraphError } = await supabase
          .from("about")
          .select("*")
          .order("position", { ascending: true });

        if (paragraphError) throw paragraphError;
        setParagraphs(aboutParagraphs || []);
      } catch (err) {
        console.error("Error fetching About page data:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutData();
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
              {paragraphs.length > 0 ? (
                paragraphs.map((p) => (
                  <p key={p.id}>{p.content}</p>
                ))
              ) : (
                <p>
                  I started filming five years ago, experimenting with short
                  films and music videos. Since then, I’ve grown into a
                  full-fledged videographer working with clients across various
                  industries.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AboutPage;