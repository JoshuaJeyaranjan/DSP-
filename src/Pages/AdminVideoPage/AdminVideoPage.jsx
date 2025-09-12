import React, { useState, useEffect } from "react";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./AdminVideoPage.scss";

const CATEGORIES = ["landscape", "drone", "shorts"];
const API_BASE = "https://youtube-service-6nd9.onrender.com/api/videos";

export default function AdminVideoPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  // Helper: convert normal or shorts URL to embed URL
  const toEmbedUrl = (link) => {
    try {
      const urlObj = new URL(link);
      const hostname = urlObj.hostname.toLowerCase();
      let videoId = "";

      if (hostname.includes("youtube.com")) {
        if (urlObj.pathname.startsWith("/watch")) {
          videoId = urlObj.searchParams.get("v");
        } else if (urlObj.pathname.startsWith("/shorts/")) {
          videoId = urlObj.pathname.split("/shorts/")[1];
        }
      } else if (hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      }

      if (!videoId) throw new Error("Invalid YouTube link");

      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      return null;
    }
  };

  // Fetch current videos for selected category
  const fetchVideos = async (cat) => {
    try {
      const res = await fetch(`${API_BASE}/${cat}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching videos");
    }
  };

  useEffect(() => {
    fetchVideos(category);
  }, [category]);

  // Add a new video
  const handleAddVideo = async () => {
    setError(null);
    if (!title.trim() || !url.trim()) return setError("Title and URL required");

    const embedUrl = toEmbedUrl(url);
    if (!embedUrl) return setError("Invalid YouTube URL");

    try {
      const res = await fetch(`${API_BASE}/${category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url: embedUrl }),
      });

      if (!res.ok) throw new Error("Failed to add video");
      const data = await res.json();
      setVideos(data.videos);
      setTitle("");
      setUrl("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error adding video");
    }
  };

  // Delete video by index
  const handleDeleteVideo = async (index) => {
    try {
      const res = await fetch(`${API_BASE}/${category}/${index}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      const data = await res.json();
      setVideos(data.videos);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error deleting video");
    }
  };

  return (
    <>
      <Nav />
      <div className="video-admin-page">
        <h1>Video Admin Dashboard</h1>

        {error && <div className="error">{error}</div>}

        <div className="controls">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="YouTube link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button onClick={handleAddVideo}>Add Video</button>
        </div>

        <div className="video-list">
          {videos.length === 0 && <p>No videos in this category.</p>}
          {videos.map((v, idx) => (
            <div key={idx} className="video-item">
              <div className="video-title">{v.title}</div>
              <iframe
                src={v.url}
                title={v.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button onClick={() => handleDeleteVideo(idx)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}