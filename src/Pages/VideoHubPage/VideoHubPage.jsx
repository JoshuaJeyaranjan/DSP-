import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./VideoHubPage.scss";

const SERVER_URL = "https://youtube-service-6nd9.onrender.com";
const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";

function VideoHubPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/videos`);
        if (!res.ok) throw new Error("Failed to fetch video categories");

        const data = await res.json(); // data = { landscape: {...}, drone: {...}, ... }

        const categoryArr = Object.keys(data).map((key) => {
          const catData = data[key];

          // Use categoryThumbnail if exists, else fallback to first video thumbnail
          const thumbnail =
            catData?.categoryThumbnail ||
            (Array.isArray(catData?.videos) && catData.videos[0]?.thumbnail) ||
            DEFAULT_THUMB;

          // Debugging
          if (!thumbnail || thumbnail === DEFAULT_THUMB) {
            console.warn(`Thumbnail missing for category "${key}"`);
          }

          return {
            name: key,
            path: `/video/${key}`,
            thumbnail,
          };
        });

        setCategories(categoryArr);
      } catch (err) {
        console.error("Error fetching video categories:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <p>Loading video categories...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!categories.length) return <p>No video categories found.</p>;

  return (
    <>
      <Nav />
      <div className="video-hub-page">
        <h1>Video Hub</h1>

        <div className="category-grid">
          {categories.map((cat) => {
            const { name, path, thumbnail } = cat;

            return (
              <Link key={name} to={path} className="category-card">
                <img
                  src={thumbnail}
                  alt={`${name} thumbnail`}
                  onError={(e) => {
                    console.warn(`Failed to load thumbnail for category "${name}"`);
                    e.currentTarget.onerror = null; // prevent infinite loop
                    e.currentTarget.src = DEFAULT_THUMB;
                  }}
                />
                <span className="category-name">{name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VideoHubPage;