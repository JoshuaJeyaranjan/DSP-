import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Nav.scss";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Nav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Track if viewport is mobile
  const navRef = useRef(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeMobileMenu();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  // Track window width
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 1000);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <nav className="nav">
      {/* Left section: Logo */}
      <div className="nav__section nav__section--left">
        <Link className="nav__logo-link" to="/" onClick={closeMobileMenu}>
          <img src="/photoAssets/Logo.PNG" alt="Logo" className="nav__logo" />
        </Link>
      </div>

      {/* Right section: Links + Hamburger */}
      <div className="nav__section nav__section--right" ref={navRef}>
        {/* Hamburger Button (Mobile Only) */}
        {isMobile && (
          <button
            className="nav__hamburger"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        )}

        {/* Links */}
        {(isMobile && isMobileMenuOpen) || !isMobile ? (
          <div className={`nav__links ${isMobileMenuOpen ? "nav__links--open" : ""}`}>
            <NavLink to="/" className="nav__link" onClick={closeMobileMenu}>
              Home
            </NavLink>
            <NavLink to="/video" className="nav__link" onClick={closeMobileMenu}>
              Video
            </NavLink>
            <NavLink to="/about" className="nav__link" onClick={closeMobileMenu}>
              About
            </NavLink>
            <NavLink to="/contact" className="nav__link" onClick={closeMobileMenu}>
              Contact
            </NavLink>

            {/* Social Icons */}
            <Link
              to="https://www.instagram.com/joshuajeyphotography"
              target="_blank"
              rel="noopener noreferrer"
              className="nav__link nav__link--icon"
              onClick={closeMobileMenu}
            >
              <img src="/photoAssets/instagram-icon.png" alt="Instagram" className="nav__icon" />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export default Nav;