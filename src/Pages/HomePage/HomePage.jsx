import React from "react";
import "./HomePage.scss";
import Nav from "../../Components/Nav/Nav";
import { Link } from "react-router-dom";
import Footer from "../../Components/Footer/Footer";

const HomePage = () => {
  return (
    <>
      <Nav overlay />
      <section className="home">
        <div className="home__overlay"></div>
        <div className="home__content">
          <h1 className="home__title">D|F|S V|S|ON</h1>
          <h3 className="home__subtitle">VIDEOGRAPHER & PHOTOGRAPHER</h3>
          <Link className="home__link" to="/photography">
            View Work
          </Link>
        </div>
      </section>
    <Footer />
    </>
  );
};

export default HomePage;
