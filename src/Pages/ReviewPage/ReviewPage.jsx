import React from "react";
import "./ReviewPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
/**
 * Simple TestimonialCard component
 * props:
 *  - photo: string (avatar url)
 *  - name: string
 *  - company: string
 *  - text: string
 *  - reversed: boolean (if true, avatar sits on right)
 */
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
          <p className="testimonial__company">{company}</p>
        </div>
      </div>
    </article>
  );
}

const SAMPLE_TESTIMONIALS = [
  {
    name: "Ava Roberts",
    company: "RevAuto",
    photo: "/photoAssets/testimonial-ava.jpg",
    text:
      "Working with DFS Vision was a breath of fresh air. They captured our launch event perfectly and delivered edits ahead of schedule. Highly recommend.",
  },
  {
    name: "Marcus Lee",
    company: "StudioHype",
    photo: "/photoAssets/testimonial-marcus.jpg",
    text:
      "Creative, punctual, and detail-oriented. The car photography looked magazine-ready — our social engagement doubled after the campaign.",
  },
  {
    name: "Priya Nair",
    company: "Portraits Co.",
    photo: "/photoAssets/testimonial-priya.jpg",
    text:
      "Phenomenal eye for lighting and composition. The portraits captured the personality we wanted to show. Clients keep asking who shot them!",
  },
  {
    name: "Ethan Walker",
    company: "SkyFrame Drones",
    photo: "/photoAssets/testimonial-ethan.jpg",
    text:
      "Drone footage was cinematic and stable — the edits matched our brand tone exactly. Professional across the board.",
  },
];

export default function ReviewPage() {
  return (
    <>
    <Nav/>
    <main className="testimonial-page">
      <header className="testimonial-page__header">
        <h1>What clients say</h1>
        <p className="testimonial-page__lead">
          Hand-picked quotes from recent projects — honest, short and to the point.
        </p>
      </header>

      <section className="testimonial-page__grid" aria-live="polite">
        {SAMPLE_TESTIMONIALS.map((t, i) => (
          <TestimonialCard
            key={i}
            photo={t.photo}
            name={t.name}
            company={t.company}
            text={t.text}
            reversed={i % 2 === 1} // alternate layout for visual interest
          />
        ))}
      </section>
    </main>
            <Footer/>
    </>
  );
}
