import React from "react";
import { Link } from "react-router-dom";
import { videoCategories } from "../../data/videoData";
import './VideoHubPage.scss'
import Nav from "../../Components/Nav/Nav";

function VideoHubPage() {
  return (
    <>
    <Nav></Nav>
    <div className="video-hub-page">
      <h1>Video Portfolio</h1>
      <div className="video-categories">
        {videoCategories.map((category, idx) => (
          <Link to={category.path} className="video-category-card" key={idx}>
            <img src={category.thumbnail} alt={category.name} />
            <h2>{category.name}</h2>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}

export default VideoHubPage;