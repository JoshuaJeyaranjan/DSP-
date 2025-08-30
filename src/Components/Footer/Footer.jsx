import React from "react";
import "./Footer.scss";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer" role="contentinfo">
      <p className="footer__copyright">
        &copy; {new Date().getFullYear()} DFS Vision. All rights reserved.
      </p>

      <div className="footer__socials">
        <a
          href="https://www.instagram.com/dfs.vision/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer__social-link"
          aria-label="Instagram"
        >
          <img
            className="footer__icon"
            src="/photoAssets/instagram.svg"
            alt="Instagram"
          />
        </a>

        <button
          className="footer__back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
          type="button"
        >
          <span className="arrow">↑</span>
        </button>
      </div>
    </footer>
  );
}

export default Footer;
