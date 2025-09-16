import React, { useState } from "react";
import "./VideoGallery.scss";
import { toEmbedUrl } from "../../utils/youtube";

function VideoGallery({ videos, videosPerPage = 6 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(null);

  const startIdx = currentPage * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const currentVideos = videos.slice(startIdx, endIdx);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const handlePlayVideo = (idx) => setPlayingIdx(idx);

  return (
    <div className="video-gallery">
      <div className="video-grid">
        {currentVideos.map((video, idx) => {
          const videoKey = startIdx + idx;

          return (
            <div className="video-card" key={videoKey}>
              <div
                className="video-wrapper"
                style={{
                  position: "relative",
                  width: "100%",
                  paddingBottom: "56.25%",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => handlePlayVideo(videoKey)}
              >
                <iframe
                  src={toEmbedUrl(video.url, {
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    autoplay: playingIdx === videoKey ? 1 : 0,
                  })}
                  title={video.title}
                  allowFullScreen
                  loading="lazy"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </div>
              
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={currentPage === idx ? "active" : ""}
              onClick={() => {
                setCurrentPage(idx);
                setPlayingIdx(null);
              }}
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