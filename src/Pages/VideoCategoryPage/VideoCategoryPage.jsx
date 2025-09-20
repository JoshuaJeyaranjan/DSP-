import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoGallery from "../../Components/VideoGallery/VideoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import LoadingSkeleton from "../../Components/LoadingSkeleton/LoadingSkeleton";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;

const supabase = createClient(PROJECT_URL, ANON_KEY);

function VideoCategoryPage() {
  const { category } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchVideos = async () => {
    setLoading(true);
    try {
      // 1️⃣ Get category ID
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();

      if (catError || !catData) throw new Error(catError?.message || "Category not found");

      const categoryId = catData.id;

      // 2️⃣ Get videos by category_id
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: true });

      if (videosError) throw new Error(videosError.message);

      setVideos(Array.isArray(videosData) ? videosData : []);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchVideos();
}, [category]);

  if (loading) return <PageLoader/>;
  if (error) return <p>Error: {error}</p>;
  if (!videos || videos.length === 0) return <p>No videos found for this category.</p>;

  return (
    <>
      <Nav />
      <div className="video-category-page">
        <h1 className="title">{category.charAt(0).toUpperCase() + category.slice(1)} </h1>
        <VideoGallery videos={videos} loading={loading} />
      </div>
      <Footer />
    </>
  );
}

export default VideoCategoryPage;