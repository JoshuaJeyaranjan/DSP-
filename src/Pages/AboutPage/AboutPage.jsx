import React from 'react';
import './AboutPage.scss';
import Nav from '../../Components/Nav/Nav';
import Footer from '../../Components/Footer/Footer';
function AboutPage() {
  return (
    <>
    <Nav></Nav>
    <div className="about-page">
      <div className="about-hero">
        <h1>About Me</h1>
        <p>
          I’m a passionate videographer specializing in capturing moments that tell a story.
          From landscapes to events, my goal is to make every frame memorable.
        </p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <img
            src="/photoAssets/about-profile.jpg"
            alt="Videographer profile"
            className="about-image"
          />
          <div className="about-text">
            <h2>My Journey</h2>
            <p>
              I started filming five years ago, experimenting with short films and music videos.
              Since then, I’ve grown into a full-fledged videographer working with clients
              across various industries.
            </p>
          </div>
        </div>

        <div className="about-section reverse">
          <div className="about-text">
            <h2>My Philosophy</h2>
            <p>
              Every project is unique. I strive to understand the vision of my clients and
              translate it into stunning visual narratives that resonate.
            </p>
          </div>
          <img
            src="/photoAssets/about-work.jpg"
            alt="Videography work"
            className="about-image"
          />
        </div>
      </div>
      <Footer></Footer>
    </div>
    </>
  );
}

export default AboutPage;