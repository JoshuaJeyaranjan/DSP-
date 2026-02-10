import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Nav.scss";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

/**
 * @param {boolean} overlay
 */
function Nav({ overlay = false }) {
  const { theme } = useTheme() || { theme: "light" };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef(null);

  const LOGO_WHITE = "/photoAssets/white-logo.png";
  const LOGO_BLACK = "/photoAssets/black-logo.png";

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeMobileMenu();
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const CHECK_BREAKPOINT = 1000;
    const handleResize = () =>
      setIsMobile(window.innerWidth <= CHECK_BREAKPOINT);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const modeClass = overlay ? "nav--overlay" : "nav--solid";

  const logoSrc = theme === "dark" ? LOGO_WHITE : LOGO_BLACK;

  return (
    <nav className={`nav nav--fixed ${modeClass}`}>
      <Link
        to="/"
        className="nav__logo-link logo_mobile"
        onClick={closeMobileMenu}
      >
        <div className="logo-wrap scale-zoom">
          <img src={logoSrc} alt="DFS Vision logo" className="nav__logo" />
        </div>
      </Link>

      <div className="nav__inner" ref={navRef}>
        <div className="nav__section nav__section--left"></div>

        <div className="nav__section nav__section--right">
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

          {(isMobile && isMobileMenuOpen) || !isMobile ? (
            <div
              className={`nav__links ${
                isMobileMenuOpen ? "nav__links--open" : ""
              }`}
            >
              <NavLink
                to="/video"
                end={true}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Film
              </NavLink>

              <NavLink
                to="/photography"
                end={false}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Stills
              </NavLink>

              <NavLink
                to="/reviews"
                end={true}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Reviews
              </NavLink>

              <Link
                to="/"
                className="nav__logo-link logo_desktop"
                onClick={closeMobileMenu}
              >
                <div className="logo-wrap scale-zoom">
                  <img
                    src={logoSrc}
                    alt="DFS Vision logo"
                    className="nav__logo"
                  />
                </div>
              </Link>

              <NavLink
                to="/about"
                end={true}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                About
              </NavLink>

              <NavLink
                to="/contact"
                end={true}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Contact
              </NavLink>
              <NavLink
                to="/packages"
                end={true}
                className={({ isActive }) =>
                  `nav__link ${isActive ? "nav__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Packages
              </NavLink>

              <a
                href="https://www.instagram.com/dfs.vision/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav__link nav__link--icon"
                onClick={closeMobileMenu}
              >
                <img
                  src="/photoAssets/instagram.svg"
                  alt="Instagram"
                  className="nav__icon"
                />
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
