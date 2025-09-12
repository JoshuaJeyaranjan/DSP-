import React, { useState } from "react";
import "./VideoGallery.scss";

function VideoGallery({ videos, videosPerPage = 6 }) {
  const [currentPage, setCurrentPage] = useState(0);

  const startIdx = currentPage * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const currentVideos = videos.slice(startIdx, endIdx);

  const totalPages = Math.ceil(videos.length / videosPerPage);

  // Helper function to normalize YouTube URLs
  const toEmbedUrl = (url) => {
    if (!url) return "";

    // Already embed format
    if (url.includes("/embed/")) return url;

    // Match normal YouTube URLs
    const watchMatch = url.match(/v=([^&]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Handle shortened youtu.be URLs
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Fallback
    return url;
  };

  return (
    <div className="video-gallery">
      <div className="video-grid">
        {currentVideos.map((video, idx) => (
          <div className="video-card" key={idx}>
            <div className="video-wrapper">
              <iframe
                src={toEmbedUrl(video.url)}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
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

export default VideoGallery;