import React from "react";
import { Link } from "react-router-dom";
import { videoCategories } from "../../data/videoData";
import './VideoHubPage.scss'
import '../PhotoHubPage/PhotoHubPage.scss'
import Nav from "../../Components/Nav/Nav";
import Footer from '../../Components/Footer/Footer';
function VideoHubPage() {
  return (
    <>
    <Nav overlay></Nav>
    
    <div className="video-hub-page">
      <div className="hero">
      <div className="overlay"></div>
      <h1 className="title">FILM</h1>
      </div>
      
      <div className="video-categories">
        {videoCategories.map((category, idx) => (
          <Link to={category.path} className="video-category-card" key={idx}>
            <h2 className="category-title">{category.name}</h2>
            <img src={category.thumbnail} alt={category.name} />
            
          </Link>
        ))}
      </div>
    </div>
    <Footer></Footer>
    </>
  );
}

export default VideoHubPage;