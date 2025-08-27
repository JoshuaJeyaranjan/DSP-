import React from "react";
import { Link } from "react-router-dom";
import { photoCategories } from "../../data/photoData";
import './PhotoHubPage.scss'
import Nav from "../../Components/Nav/Nav";
function PhotoHubPage() {
  return (
    <>
    <Nav></Nav>
    <div className="photo-hub-page">
      <h1>Photography Portfolio</h1>
      <div className="photo-categories">
        {photoCategories.map((category, idx) => (
          <Link to={category.path} className="photo-category-card" key={idx}>
            <img src={category.thumbnail} alt={category.name} />
            <h2>{category.name}</h2>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}

export default PhotoHubPage;