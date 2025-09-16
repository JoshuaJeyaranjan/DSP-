import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoGallery from "../../Components/VideoGallery/VideoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

const SERVER_URL = "https://youtube-service-6nd9.onrender.com"; // replace this

function VideoCategoryPage() {
  const { category } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 useEffect(() => {
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${category}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      
      // Ensure we get an array, or empty array if missing
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchVideos();
}, [category]);

  if (loading) return <p>Loading videos...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!videos || videos.length === 0) return <p>No videos found for this category.</p>;

  return (
    <>
      <Nav />
      <div className="video-category-page">
        <h1>{category.charAt(0).toUpperCase() + category.slice(1)} Videos</h1>
        <VideoGallery videos={videos} />
      </div>
      <Footer />
    </>
  );
}

export default VideoCategoryPage;