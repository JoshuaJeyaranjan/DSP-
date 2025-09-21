// src/utils/youtube.js
export function toEmbedUrl(link) {
  if (!link) return "";

  // Already embed
  if (link.includes("/embed/")) return link;

  try {
    const urlObj = new URL(link);
    const hostname = urlObj.hostname.toLowerCase();
    let videoId = "";

    if (hostname.includes("youtube.com")) {
      if (urlObj.pathname.startsWith("/watch")) {
        videoId = urlObj.searchParams.get("v");
      } else if (urlObj.pathname.startsWith("/shorts/")) {
        videoId = urlObj.pathname.split("/shorts/")[1];
      }
    } else if (hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // Fallback if URL parsing fails
  }

  return link;
}