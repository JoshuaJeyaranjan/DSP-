import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoGallery from "../../Components/PhotoGallery/PhotoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import "./PhotoCategoryPage.scss";
import LoadingSkeleton from "../../Components/LoadingSkeleton/LoadingSkeleton";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

// Map route categories to database categories
const categoryMap = {
  cars: "car",
  portraits: "portrait",
  drones: "drone",
  sports: "sports",
  product: "product",
};

// Responsive breakpoints
const getSize = (width) => {
  if (width >= 1024) return "large";
  if (width >= 768) return "medium";
  return "small";
};

// Hook to track window width
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

function PhotoCategoryPage() {
  const { category } = useParams();
  const windowWidth = useWindowWidth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      setLoading(true);
      try {
        const dbCategory = categoryMap[category] || category;

        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("category", dbCategory)
          .order("created_at", { ascending: false });

        if (error || !data) throw error || new Error("No data returned");

        const size = getSize(windowWidth);

        const mappedPhotos = [];
        const seenOriginals = new Set();

        data.forEach((img) => {
          const baseName = img.path.replace(/^.*[\\/]/, "").replace(/\.[^/.]+$/, "");
          if (seenOriginals.has(baseName)) return;
          seenOriginals.add(baseName);

          const avifPath = `${size}/${baseName}.avif`;
          const webpPath = `${size}/${baseName}.webp`;
          const fallbackPath = `${size}/${baseName}.jpg`;

          const { data: avifData } = supabase.storage.from("photos-derived").getPublicUrl(avifPath);
          const { data: webpData } = supabase.storage.from("photos-derived").getPublicUrl(webpPath);
          const { data: fallbackData } = supabase.storage.from("photos-derived").getPublicUrl(fallbackPath);

          mappedPhotos.push({
            id: img.id,
            avifSrc: avifData?.publicUrl,
            webpSrc: webpData?.publicUrl,
            fallbackSrc: fallbackData?.publicUrl || "/placeholder.jpg",
            title: img.title || img.path,
            largeSrc: supabase.storage.from("photos-derived").getPublicUrl(`large/${baseName}.avif`)?.data?.publicUrl,
          });
        });

        setPhotos(mappedPhotos);
      } catch (err) {
        console.error("Unexpected error fetching images:", err);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [category, windowWidth]);

  if (loading) return <LoadingSkeleton />;
  if (!photos.length) return <p>No images found for this category.</p>;

  return (
    <>
      <Nav />
      <div className="photo-category-page">
        <h1 className="title">{category.charAt(0).toUpperCase() + category.slice(1)}</h1>
        <PhotoGallery photos={photos} />
      </div>
      <Footer />
    </>
  );
}

export default PhotoCategoryPage;