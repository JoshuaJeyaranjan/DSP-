import React, { useState } from "react";
import "./VideoGallery.scss";

function VideoGallery({ videos, videosPerPage = 6 }) {
  const [currentPage, setCurrentPage] = useState(0);

  const startIdx = currentPage * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const currentVideos = videos.slice(startIdx, endIdx);

  const totalPages = Math.ceil(videos.length / videosPerPage);

  return (
    <div className="video-gallery">
      <div className="video-grid">
        {currentVideos.map((video, idx) => (
          <div className="video-card" key={idx}>
            <div className="video-wrapper">
              <iframe
                src={video.url}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            {video.title && <h3>{video.title}</h3>}
            {video.description && <p>{video.description}</p>}
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