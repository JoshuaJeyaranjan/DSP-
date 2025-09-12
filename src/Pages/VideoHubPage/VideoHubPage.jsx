import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./VideoHubPage.scss";

const SERVER_URL = "https://youtube-service-6nd9.onrender.com"; // replace with your server URL

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
        const data = await res.json();

        // Transform server data into array of categories with thumbnail
        const categoryArr = Object.keys(data).map((key) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          path: `/video/${key}`,
          thumbnail: data[key][0]?.thumbnail || "/photoAssets/videoThumbnails/default.jpg", // fallback thumbnail
        }));

        setCategories(categoryArr);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <p>Loading video categories...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!categories || categories.length === 0) return <p>No video categories found.</p>;

  return (
    <>
      <Nav />
      <div className="video-hub-page">
        <h1>Video Hub</h1>
        <div className="video-categories">
          {categories.map((cat, idx) => (
            <Link key={idx} to={cat.path} className="category-card">
              <img src={cat.thumbnail} alt={cat.name} />
              <div className="overlay">
                <h2>{cat.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VideoHubPage;