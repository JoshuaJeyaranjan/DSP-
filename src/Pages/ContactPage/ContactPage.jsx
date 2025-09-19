import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";
import "./ContactPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import PageLoader from "../../Components/PageLoader/PageLoader";
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const supabase = createClient(PROJECT_URL, ANON_KEY);

const DEFAULT_BANNER_URL = "/photoAssets/contact-placeholder.avif";

function ContactPage() {
  const [bannerUrl, setBannerUrl] = useState(DEFAULT_BANNER_URL);
  const [formStatus, setFormStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Fetch Contact Banner from Supabase
  // ---------------------------
  useEffect(() => {
    async function fetchBanner() {
      try {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("is_contact_image", true)
          .limit(1)
          .single(); // ensures we only get one

        if (error) throw error;

        if (data) {
          const { data: urlData } = supabase.storage
            .from(data.bucket)
            .getPublicUrl(data.path);
          setBannerUrl(urlData?.publicUrl ?? DEFAULT_BANNER_URL);
        } else {
          console.warn("[ContactPage] No contact image found");
          setBannerUrl(DEFAULT_BANNER_URL);
        }
      } catch (err) {
        console.error("[ContactPage] Error fetching contact image:", err);
        setBannerUrl(DEFAULT_BANNER_URL);
      } finally {
        setLoading(false);
      }
    }

    fetchBanner();
  }, []);

  // ---------------------------
  // EmailJS Form Submit
  // ---------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        e.target,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setFormStatus("Message sent successfully!");
          e.target.reset();
        },
        (error) => {
          setFormStatus("Oops! Something went wrong.");
          console.error(error.text);
        }
      );
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <>
      <Nav />
      <div className="contact-page">
        {loading ? (
          <div className="loading-banner">
            <PageLoader />
            <p>Loading contact banner...</p>
          </div>
        ) : (
          <div className="contact-hero">
            <img
              className="contact__image"
              src={bannerUrl}
              alt="Contact banner"
              onError={(e) => (e.currentTarget.src = DEFAULT_BANNER_URL)}
            />
          </div>
        )}

        <div className="contact-content">
          <h1>Contact Me</h1>
          <p>Send a message and I’ll get back to you as soon as possible.</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input type="text" name="name" placeholder="Your Name" required />
            </label>

            <label>
              Email
              <input type="email" name="email" placeholder="Your Email" required />
            </label>

            <label>
              Message
              <textarea name="message" placeholder="Your Message" required />
            </label>

            <button type="submit">Send</button>

            {formStatus && <p className="form-status">{formStatus}</p>}
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ContactPage;