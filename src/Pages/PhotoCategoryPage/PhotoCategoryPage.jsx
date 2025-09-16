import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoGallery from "../../Components/PhotoGallery/PhotoGallery";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import "./PhotoCategoryPage.scss";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

// Map route categories to database categories
const categoryMap = {
  cars: "car",
  portraits: "portrait",
  drones: "drone",
  sports: "sports",
};

function PhotoCategoryPage() {
  const { category } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      console.log(`Loading photos for category: ${category}`);
      setLoading(true);
      try {
        const dbCategory = categoryMap[category] || category;
        console.log(`Mapped category to database category: ${dbCategory}`);

        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("category", dbCategory)
          .order("created_at", { ascending: false });

        if (!error) {
          console.log(
            `Fetched ${data.length} images for category "${dbCategory}"`
          );

          // Filter for medium webp or medium jpeg/avif if you want fallback
    const mappedPhotos = [];

// Use a Set to track which original filenames we've already added
const seenOriginals = new Set();

data.forEach(img => {
  // Derive a "base name" from the original file
  const baseName = img.path.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '');
  
  if (seenOriginals.has(baseName)) return; // skip duplicates
  seenOriginals.add(baseName);

  // Construct a single canonical derived path
  const derivedPath = `medium/${baseName}.webp`;

  const { data: publicUrlData } = supabase
    .storage
    .from("photos-derived")
    .getPublicUrl(derivedPath);

  mappedPhotos.push({
    id: img.id,
    src: publicUrlData.publicUrl,
    title: img.title || img.path,
    fallbackSrc: "/placeholder.jpg",
  });
});
          setPhotos(mappedPhotos);
        }
      } catch (err) {
        console.error("Unexpected error fetching images:", err);
        setPhotos([]);
      } finally {
        setLoading(false);
        console.log("Finished loading photos");
      }
    };

    loadPhotos();
  }, [category]);

  if (loading) return <p>Loading images...</p>;
  if (!photos.length) return <p>No images found for this category.</p>;

  return (
    <>
      <Nav />
      <div className="photo-category-page">
        <h1 className="title">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </h1>
        <PhotoGallery photos={photos} />
      </div>
      <Footer />
    </>
  );
}

export default PhotoCategoryPage;
