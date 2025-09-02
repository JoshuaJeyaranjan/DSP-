import React from "react";
import { Link } from "react-router-dom";
import { photoCategories } from "../../data/photoData";
import './PhotoHubPage.scss'
import Nav from "../../Components/Nav/Nav";
import Footer from '../../Components/Footer/Footer';
function PhotoHubPage() {
  return (
    <>
    <Nav overlay></Nav>
    <div className="photo-hub-page">
      
      <div className="hero">
      <div className="overlay"></div>
      <h1 className='title'>STILLS</h1>
      </div>
      <div className="photo-categories">
        {photoCategories.map((category, idx) => (
          <Link to={category.path} className="photo-category-card" key={idx}>
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

export default PhotoHubPage;