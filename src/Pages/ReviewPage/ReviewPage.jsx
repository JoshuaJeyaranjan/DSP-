import React, { useEffect, useState } from "react";
import "./ReviewPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { supabase } from "../../utils/supabaseClient"; // make sure path is correct

function TestimonialCard({ photo, name, company, text, reversed = false }) {
  return (
    <article
      className={`testimonial__card ${reversed ? "testimonial__card--reversed" : ""}`}
      aria-label={`Testimonial from ${name} at ${company}`}
    >
      <div className="testimonial__avatar">
        <img src={photo} alt={`${name} avatar`} />
      </div>

      <div className="testimonial__content">
        <div className="testimonial__bubble" role="article">
          <p className="testimonial__text">{text}</p>
        </div>

        <div className="testimonial__meta">
          <p className="testimonial__name">{name}</p>
          <p className="testimonial__company">{company || ""}</p>
        </div>
      </div>
    </article>
  );
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data) {
          setReviews([]);
        } else {
          setReviews(data);
        }
      } catch (err) {
        console.error("[ReviewPage] Error fetching reviews:", err);
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return (
    <>
      <Nav />
      <main className="testimonial-page">
        <header className="testimonial-page__header">
          <h1>What clients say</h1>
          <p className="testimonial-page__lead">
            Hand-picked quotes from recent projects — honest, short and to the point.
          </p>
        </header>

        {loading && <p className="loading">Loading reviews...</p>}
        {error && <p className="error">{error}</p>}

        <section className="testimonial-page__grid" aria-live="polite">
          {!loading &&
            !error &&
            reviews.map((r, i) => (
              <TestimonialCard
                key={r.id}
                photo={r.image_url}
                name={r.name}
                company={r.company || ""}
                text={r.content}
                reversed={i % 2 === 1}
              />
            ))}
        </section>
      </main>
      <Footer />
    </>
  );
}