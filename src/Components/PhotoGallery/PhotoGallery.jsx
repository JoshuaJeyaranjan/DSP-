import React, { useState } from "react";
import "./PhotoGallery.scss";

function PhotoGallery({ photos, photosPerPage = 20 }) {
  const [currentPage, setCurrentPage] = useState(0);

  const startIdx = currentPage * photosPerPage;
  const endIdx = startIdx + photosPerPage;
  const currentPhotos = photos.slice(startIdx, endIdx);

  const totalPages = Math.ceil(photos.length / photosPerPage);

  return (
    <div className="photo-gallery">
      <div className="photo-grid">
        {currentPhotos.map((photo, idx) => (
          <div className="photo-card" key={idx}>
            <img src={photo.src} alt={photo.title} loading="lazy" />
            
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
    </div>
  );
}

export default PhotoGallery;