// src/components/Nav/Nav.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Nav.scss";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

function Nav() {
  const { theme } = useTheme() || { theme: "light" };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef(null);

  const LOGO_LIGHT = "/photoAssets/black-logo.png";
  const LOGO_DARK = "/photoAssets/white-logo.png";

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
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

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeMobileMenu();
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

  // Always solid logo depending on theme
  const logoSrc = theme === "dark" ? LOGO_DARK : LOGO_LIGHT;

  return (
    <nav className="nav nav--fixed">
      {/* Mobile logo */}
      <Link to="/" className="nav__logo-link logo_mobile" onClick={closeMobileMenu}>
        <div className="logo-wrap scale-zoom">
          <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
        </div>
      </Link>

      <div className="nav__inner" ref={navRef}>
        <div className="nav__section nav__section--right">
          {/* Hamburger */}
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

          {/* Links */}
          {(isMobile && isMobileMenuOpen) || !isMobile ? (
            <div className={`nav__links ${isMobileMenuOpen ? "nav__links--open" : ""}`}>
              <NavLink to="/video" className="nav__link" onClick={closeMobileMenu}>Video</NavLink>
              <NavLink to="/photography" className="nav__link" onClick={closeMobileMenu}>Photography</NavLink>
              <NavLink to="/reviews" className="nav__link" onClick={closeMobileMenu}>Reviews</NavLink>

              {/* Desktop center logo */}
              <Link to="/" className="nav__logo-link logo_desktop" onClick={closeMobileMenu}>
                <div className="logo-wrap scale-zoom">
                  <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
                </div>
              </Link>

              <NavLink to="/about" className="nav__link" onClick={closeMobileMenu}>About</NavLink>
              <NavLink to="/contact" className="nav__link" onClick={closeMobileMenu}>Contact</NavLink>

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
