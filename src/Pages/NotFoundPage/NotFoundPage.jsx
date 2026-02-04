import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

export default function NotFoundPage() {
  return (
    <>
      <Nav />
      <div className="notfound-page">
        <div className="notfound-content">
          <h1>404</h1>
          <h2>Oops! Page not found.</h2>
          <p>The page you’re looking for doesn’t exist or has been moved.</p>
          <Link to="/" className="home-link">
            ← Go back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
