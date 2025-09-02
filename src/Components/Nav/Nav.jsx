import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Nav.scss";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

/**
 * Nav component
 * @param {boolean} overlay - when true, nav starts transparent overlaying the hero.
 *                            when false (default), nav is solid.
 */
function Nav({ overlay = false }) {
  const { theme } = useTheme() || { theme: "light" }; // 'light' | 'dark'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef(null);

  // Logo asset paths (put these in public/photoAssets/)
  const LOGO_WHITE = "/photoAssets/white-logo.png"; // used in dark theme
  const LOGO_BLACK = "/photoAssets/black-logo.png"; // used in light theme

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu when clicking outside the nav menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeMobileMenu();
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  // Close mobile menu on Escape 
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Track window width for mobile view
  useEffect(() => {
    const CHECK_BREAKPOINT = 1000;
    const handleResize = () => setIsMobile(window.innerWidth <= CHECK_BREAKPOINT);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // NOTE: no overlay->solid switch on scroll as requested.
  // We keep `overlay` only for styling (CSS) differences.
  const modeClass = overlay ? "nav--overlay" : "nav--solid";

  // SIMPLE THEME -> LOGO MAPPING
  // Dark theme -> white logo, Light theme -> black logo
  const logoSrc = theme === "dark" ? LOGO_WHITE : LOGO_BLACK;

  return (
    <nav className={`nav nav--fixed ${modeClass}`}>
      {/* Mobile logo (CSS shows/hides .logo_mobile/.logo_desktop appropriately) */}
      <Link to="/" className="nav__logo-link logo_mobile" onClick={closeMobileMenu}>
        <div className="logo-wrap scale-zoom">
          <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
        </div>
      </Link>

      <div className="nav__inner" ref={navRef}>
        <div className="nav__section nav__section--left">
          {/* intentionally left empty to center links (logo sits in center on desktop) */}
        </div>

        <div className="nav__section nav__section--right">
          {/* Hamburger (visible via CSS at mobile breakpoint) */}
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

          {/* Links (desktop row or mobile dropdown) */}
          {(isMobile && isMobileMenuOpen) || !isMobile ? (
            <div className={`nav__links ${isMobileMenuOpen ? "nav__links--open" : ""}`}>
              <NavLink
                to="/video"
                end={true}
                className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
                onClick={closeMobileMenu}
              >
                Video
              </NavLink>

              <NavLink
                to="/photography"
                end={false} // prefix matching so nested routes stay active
                className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
                onClick={closeMobileMenu}
              >
                Photography
              </NavLink>

              <NavLink
                to="/reviews"
                end={true}
                className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
                onClick={closeMobileMenu}
              >
                Reviews
              </NavLink>

              {/* Center logo for desktop */}
              <Link to="/" className="nav__logo-link logo_desktop" onClick={closeMobileMenu}>
                <div className="logo-wrap scale-zoom">
                  <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
                </div>
              </Link>

              <NavLink
                to="/about"
                end={true}
                className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
                onClick={closeMobileMenu}
              >
                About
              </NavLink>

              <NavLink
                to="/contact"
                end={true}
                className={({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`}
                onClick={closeMobileMenu}
              >
                Contact
              </NavLink>

              <a
                href="https://www.instagram.com/dfs.vision/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav__link nav__link--icon"
                onClick={closeMobileMenu}
              >
                <img src="/photoAssets/instagram.svg" alt="Instagram" className="nav__icon" />
              </a>

              <div>
                <ThemeToggle />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
