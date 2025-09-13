import React, { useState } from "react";
import "./VideoGallery.scss";
import { toEmbedUrl } from "../../utils/youtube";

const DEFAULT_THUMB = "/photoAssets/videoThumbnails/default.jpg";

function VideoGallery({ videos, videosPerPage = 6 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(null); // track which video is playing

  const startIdx = currentPage * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const currentVideos = videos.slice(startIdx, endIdx);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const handlePlayVideo = (idx) => {
    setPlayingIdx(idx);
  };

  return (
    <div className="video-gallery">
      <div className="video-grid">
        {currentVideos.map((video, idx) => {
          const videoKey = startIdx + idx; // unique key across pages
          const thumbnail = video.thumbnail || DEFAULT_THUMB;

          return (
            <div className="video-card" key={videoKey}>
              <div className="video-wrapper">
                {playingIdx === videoKey ? (
                  <iframe
                    src={toEmbedUrl(video.url)}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="thumbnail-wrapper"
                    onClick={() => handlePlayVideo(videoKey)}
                    style={{
                      backgroundImage: `url(${thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      width: "100%",
                      height: "0",
                      paddingBottom: "56.25%", // 16:9 aspect ratio
                      position: "relative",
                    }}
                  >
                    <div className="play-button-overlay">
                      ▶
                    </div>
                  </div>
                )}
              </div>
              <div className="video-title">{video.title}</div>
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
                setPlayingIdx(null); // reset playing video on page change
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