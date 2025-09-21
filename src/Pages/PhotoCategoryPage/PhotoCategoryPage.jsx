import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoGallery from "../../Components/PhotoGallery/PhotoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import "./PhotoCategoryPage.scss";
import LoadingSkeleton from "../../Components/LoadingSkeleton/LoadingSkeleton";
import PageLoader from "../../Components/PageLoader/PageLoader";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

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
  const { category: categorySlug } = useParams(); // e.g. "cars", "portraits"
  const windowWidth = useWindowWidth();

  const [category, setCategory] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch category + images
  useEffect(() => {
    const loadCategoryAndPhotos = async () => {
      setLoading(true);
      try {
        // 1. Find category row by slug
        const { data: categoryRow, error: catErr } = await supabase
          .from("image_categories")
          .select("*")
          .eq("slug", categorySlug)
          .maybeSingle();

        if (catErr || !categoryRow) throw catErr || new Error("Category not found");

        setCategory(categoryRow);

        // 2. Fetch images by category_id
        const { data: images, error: imgErr } = await supabase
          .from("images")
          .select("*")
          .eq("category_id", categoryRow.id)
          .order("created_at", { ascending: false });

        if (imgErr || !images) throw imgErr || new Error("No images found");

        const size = getSize(windowWidth);

        // 3. Map images to gallery format
        const mappedPhotos = [];
        const seenOriginals = new Set();

        images.forEach((img) => {
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
        console.error("Error loading category/photos:", err);
        setPhotos([]);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryAndPhotos();
  }, [categorySlug, windowWidth]);

  if (loading) return <PageLoader />;
  if (!category) return <p>Category not found.</p>;
  if (!photos.length) return <p>No images found for this category.</p>;

  return (
    <>
      <Nav />
      <div className="photo-category-page">
        <h1 className="title">
  {category?.name
    ? category.name.charAt(0).toUpperCase() + category.name.slice(1)
    : category}
</h1>
        <PhotoGallery photos={photos} />
      </div>
      <Footer />
    </>
  );
}

export default PhotoCategoryPage;