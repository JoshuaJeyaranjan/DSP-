import React, { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./PhotoGallery.scss";

function PhotoGallery({ photos, photosPerPage = 20 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startIdx = currentPage * photosPerPage;
  const endIdx = startIdx + photosPerPage;
  const currentPhotos = photos.slice(startIdx, endIdx);

  const totalPages = Math.ceil(photos.length / photosPerPage);

  return (
    <div className="photo-gallery">
      <div className="photo-grid">
        {currentPhotos.map((photo, idx) => (
          <div
            className="photo-card"
            key={idx}
            onClick={() => {
              setCurrentIndex(startIdx + idx);
              setLightboxOpen(true);
            }}
          >
            <img
              className="photo"
              src={photo.src}
              alt={photo.title}
              loading="lazy"
            />
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

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        index={currentIndex}
        close={() => setLightboxOpen(false)}
        slides={photos.map((p) => ({ src: p.src }))}
      />
    </div>
  );
}

export default PhotoGallery;
