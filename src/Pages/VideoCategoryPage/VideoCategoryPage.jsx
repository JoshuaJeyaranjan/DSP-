import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoGallery from "../../Components/VideoGallery/VideoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

function VideoCategoryPage() {
  const { category } = useParams();
  const [videos, setVideos] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("name")
          .eq("id", category)
          .maybeSingle();

        if (error) throw error;
        if (data) setCategoryName(data.name);
      } catch (err) {
        console.error("Error fetching category name:", err);
        setError(err.message);
      }
    };

    if (category) fetchCategoryName();
  }, [category]);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("category_id", category)
          .order("created_at", { ascending: true });

        if (videosError) throw videosError;

        setVideos(Array.isArray(videosData) ? videosData : []);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (category) fetchVideos();
  }, [category]);

  if (loading) return <PageLoader />;
  if (error) return <p>Error: {error}</p>;
  if (!videos || videos.length === 0)
    return (
      <>
        <Nav />
        <div className="video-category-page">
          <h1 className="title">{categoryName || "Category"}</h1>
          <p>No videos found for this category.</p>
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <Nav />
      <div className="video-category-page">
        <h1 className="title">{categoryName || "Category"}</h1>
        <VideoGallery videos={videos} loading={loading} />
      </div>
      <Footer />
    </>
  );
}

export default VideoCategoryPage;
