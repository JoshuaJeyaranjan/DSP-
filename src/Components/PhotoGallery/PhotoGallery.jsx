import React, { useState, useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./PhotoGallery.scss";

function PhotoGallery({ photos, photosPerPage = 20 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startIdx = currentPage * photosPerPage;
  const endIdx = startIdx + photosPerPage;
  const currentPhotos = useMemo(
    () => photos.slice(startIdx, endIdx),
    [photos, startIdx, endIdx],
  );
  const totalPages = Math.ceil(photos.length / photosPerPage);

  return (
    <div className="photo-gallery">
      <div className="photo-grid">
        {currentPhotos.map((photo) => (
          <div
            className="photo-card"
            key={photo.id}
            onClick={() => {
              const idx = photos.findIndex((p) => p.id === photo.id);
              setCurrentIndex(idx);
              setLightboxOpen(true);
            }}
          >
            <picture>
              {photo.avifSrc && (
                <source type="image/avif" srcSet={photo.avifSrc} />
              )}
              {photo.webpSrc && (
                <source type="image/webp" srcSet={photo.webpSrc} />
              )}
              <img
                src={photo.fallbackSrc}
                alt={photo.title}
                loading="lazy"
                onError={(e) => {
                  if (e.target.src !== "/placeholder.jpg")
                    e.target.src = "/placeholder.jpg";
                }}
              />
            </picture>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={currentPage === idx ? "active" : ""}
              onClick={() => setCurrentPage(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        index={currentIndex}
        close={() => setLightboxOpen(false)}
        slides={photos.map((p) => ({
          src: p.largeSrc || p.fallbackSrc,
          title: p.title,
        }))}
      />
    </div>
  );
}

export default PhotoGallery;
