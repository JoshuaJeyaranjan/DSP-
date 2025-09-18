import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com';
import './ContactPage.scss';
import Nav from '../../Components/Nav/Nav';
import Footer from '../../Components/Footer/Footer';
import { getAssetsByType } from '../../utils/assets'; // Make sure this exists
import PageLoader from '../../Components/PageLoader/PageLoader'; // Optional reusable spinner component

const DEFAULT_BANNER_URL = '/photoAssets/contact-placeholder.avif'; // fallback

function ContactPage() {
  const [bannerUrl, setBannerUrl] = useState(DEFAULT_BANNER_URL);
  const [formStatus, setFormStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Fetch Contact Banner from Supabase
  // ---------------------------
  useEffect(() => {
    async function fetchBanner() {
      try {
        const data = await getAssetsByType('contact', 'contact_banner');

        if (!data) {
          console.warn('[ContactPage] No banner found in site_assets');
          setBannerUrl(DEFAULT_BANNER_URL);
          return;
        }

        setBannerUrl(data.url || DEFAULT_BANNER_URL);
      } catch (err) {
        console.error('[ContactPage] Supabase select error:', err);
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
        (result) => {
          setFormStatus('Message sent successfully!');
          e.target.reset();
        },
        (error) => {
          setFormStatus('Oops! Something went wrong.');
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
            <PageLoader /> {/* Simple reusable spinner */}
            <p>Loading contact banner...</p>
          </div>
        ) : (
          <div className="contact-hero">
            <img className="contact__image" src={bannerUrl} alt="Contact banner" />
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