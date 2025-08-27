import React from "react";
import "./Footer.scss";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="footer__top">
        <button className="footer__back-to-top" onClick={scrollToTop}>
          Back to Top ↑
        </button>
      </div>

      <div className="footer__content">
        <p className="footer__copyright">
          &copy; {new Date().getFullYear()} Joshua Jey Photography. All rights reserved.
        </p>

        <div className="footer__socials">
          <a
            href="https://www.instagram.com/joshuajeyphotography"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social-link"
          >
            Instagram
          </a>
          <a
            href="https://www.youtube.com/channel/UCXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social-link"
          >
            YouTube
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;