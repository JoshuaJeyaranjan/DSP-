// src/components/Nav/Nav.jsx
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
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);

  // Logo asset paths (put these in public/photoAssets/)
  const LOGO_WHITE = "/photoAssets/white-logo.png";    // overlay white variant
  const LOGO_LIGHT = "/photoAssets/black-logo.png"; // default / light mode logo
  const LOGO_DARK = "/photoAssets/black-logo.png";    // dark-mode logo
// Logo asset paths (put these in /public/photoAssets/)

const LOGO_BLACK = "/photoAssets/black-logo.png"; // black logo

// ----- THEME-AWARE, OVERLAY-AWARE LOGO SELECTION -----
let logoSrc;


  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu when clicking outside of the nav menu
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

  // Handle overlay -> solid on scroll (only when overlay mode is active)
  useEffect(() => {
    if (!overlay) return; // only needed for overlay navs

    let ticking = false;

    const updateScrolledState = () => {
      const heroEl = document.querySelector(".hero");
      const navHeight = document.querySelector(".nav")?.offsetHeight || 80;
      const threshold = heroEl ? Math.max(heroEl.offsetHeight - navHeight, 64) : 80;

      const shouldBeScrolled = window.scrollY > threshold;
      setIsScrolled(shouldBeScrolled);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrolledState);
        ticking = true;
      }
    };

    // run once to initialize
    updateScrolledState();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  // Choose nav modifier classes
  const modeClass = overlay ? "nav--overlay" : "nav--solid";
  const scrolledClass = overlay && isScrolled ? "scrolled" : "";

  // ----- THEME-AWARE, OVERLAY-AWARE LOGO SELECTION -----
  // Behavior:
  // - overlay && !scrolled:
  //     * light theme  -> show white overlay logo (LOGO_WHITE)
  //     * dark theme   -> show dark overlay logo (LOGO_DARK) so it reads correctly in dark theme
  // - otherwise:
  //     * dark theme   -> show LOGO_DARK
  //     * light theme  -> show LOGO_LIGHT
  const useWhiteOverlay = overlay && !isScrolled && theme === "light";
  const useDarkOverlay = overlay && !isScrolled && theme === "dark";


  if (useWhiteOverlay) {
    logoSrc = LOGO_WHITE;
  } else if (useDarkOverlay) {
    // overlay in dark theme - use the dark logo so it reads correctly
    logoSrc = LOGO_DARK;
  } else {
    // normal flow (scrolled overlay OR non-overlay)
    logoSrc = theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
  }

  if (overlay && !isScrolled) {
    // Overlay (transparent) state
    logoSrc = theme === "light" ? LOGO_WHITE : LOGO_BLACK;
  } else {
    // Solid (scrolled or non-overlay) state
    logoSrc = theme === "dark" ? LOGO_WHITE : LOGO_BLACK;
  }
  

  return (
    <nav className={`nav ${modeClass} ${scrolledClass}`}>
      {/* Left: Mobile logo (CSS will hide/show logo_mobile / logo_desktop appropriately) */}
      <Link to="/" className="nav__logo-link logo_mobile" onClick={closeMobileMenu}>
        <div className="logo-wrap scale-zoom">
          <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
        </div>
      </Link>

      {/* Inner container (for layout) */}
      <div className="nav__inner" ref={navRef}>
        <div className="nav__section nav__section--left"></div>

        <div className="nav__section nav__section--right">
          {/* Hamburger (mobile only via CSS) */}
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

          {/* Links: show inline on desktop, toggle on mobile */}
          {(isMobile && isMobileMenuOpen) || !isMobile ? (
            <div className={`nav__links ${isMobileMenuOpen ? "nav__links--open" : ""}`}>
              <NavLink to="/" className="nav__link" onClick={closeMobileMenu}>
                Home
              </NavLink>

              <NavLink to="/video" className="nav__link" onClick={closeMobileMenu}>
                Video
              </NavLink>

              <NavLink to="/photography" className="nav__link" onClick={closeMobileMenu}>
                Photography
              </NavLink>

              {/* center logo for desktop */}
              <Link to="/" className="nav__logo-link logo_desktop" onClick={closeMobileMenu}>
                <div className="logo-wrap scale-zoom">
                  <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
                </div>
              </Link>

              <NavLink to="/about" className="nav__link" onClick={closeMobileMenu}>
                About
              </NavLink>

              <NavLink to="/contact" className="nav__link" onClick={closeMobileMenu}>
                Contact
              </NavLink>

              {/* Social Icon */}
              <a
                href="https://www.instagram.com/dfs.vision/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav__link nav__link--icon"
                onClick={closeMobileMenu}
              >
                <img src="/photoAssets/instagram.svg" alt="Instagram" className="nav__icon" />
              </a>

              {/* Theme Toggle */}
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
