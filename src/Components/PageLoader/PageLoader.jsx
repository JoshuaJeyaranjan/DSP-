// src/Components/PageLoader/PageLoader.jsx
import React from "react";
import "./PageLoader.scss";
import Nav from "../Nav/Nav";
import Footer from "../Footer/Footer";
export default function PageLoader({ text = "Loading..." }) {
  return (
    <>
      <div className="page-loader">
        <div className="spinner" />
        <p className="loader-text">{text}</p>
      </div>
    </>
  );
}
