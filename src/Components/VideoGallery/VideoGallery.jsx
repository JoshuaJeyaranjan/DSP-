import React, { useEffect, useMemo, useState } from "react";
import "./VideoGallery.scss";
import { toEmbedUrl } from "../../utils/youtube";
import PageLoader from "../PageLoader/PageLoader";

function VideoGallery({ videos, videosPerPage = 6, loading = false }) {
  const safeVideos = Array.isArray(videos) ? videos : [];
  const [currentPage, setCurrentPage] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(null);

  const totalPages = useMemo(
    () => Math.ceil(safeVideos.length / videosPerPage),
    [safeVideos.length, videosPerPage],
  );

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
    } else if (currentPage >= totalPages) {
      setCurrentPage(0);
      setPlayingIdx(null);
    }
  }, [totalPages]);

  const startIdx = currentPage * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const currentVideos = safeVideos.slice(startIdx, endIdx);

  const handlePlayVideo = (idx) => {
    setPlayingIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="video-gallery">
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="video-grid">
            {currentVideos.length === 0 ? (
              <p className="no-videos">No videos to display.</p>
            ) : (
              currentVideos.map((video, idx) => {
                const videoKey = startIdx + idx;
                const embedUrl = video?.url
                  ? toEmbedUrl(video.url, {
                      controls: 1,
                      modestbranding: 1,
                      rel: 0,
                      autoplay: playingIdx === videoKey ? 1 : 0,
                    })
                  : "";

                const key = video.id || video.url || videoKey;

                return (
                  <div className="video-card fade-in" key={key}>
                    <div
                      className="video-wrapper"
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePlayVideo(videoKey)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handlePlayVideo(videoKey);
                      }}
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "56.25%",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                      aria-label={`Play ${video?.title || "video"}`}
                    >
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={video?.title || `video-${videoKey}`}
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
                      ) : (
                        <div className="invalid-video">Invalid video URL</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
        </>
      )}
    </div>
  );
}

export default VideoGallery;
