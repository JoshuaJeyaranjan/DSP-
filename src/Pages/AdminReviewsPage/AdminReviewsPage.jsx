import React, { useEffect, useState } from "react";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./AdminReviewsPage.scss";
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;

const supabase = createClient(PROJECT_URL, ANON_KEY);

const DEFAULT_PHOTO =
  "https://vuzffkcigrlzarvkoqji.supabase.co/storage/v1/object/public/photos-derived/medium/1758043612700-rkk5vv-IMG_8692.webp";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [newReview, setNewReview] = useState({
    name: "",
    company: "",
    image_url: "",
    content: "",
  });

  // Local state for editing reviews
  const [editStates, setEditStates] = useState({});

  // Fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setReviews(data);

      // Initialize editStates
      const initialEdits = {};
      data.forEach((r) => {
        initialEdits[r.id] = { ...r }; // copy current values
      });
      setEditStates(initialEdits);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Add new review
  const handleAddReview = async () => {
    const { name, company, image_url, content } = newReview;
    if (!name || !company || !content)
      return setError("Name, company, and text are required.");

    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([{ ...newReview, image_url: image_url || DEFAULT_PHOTO }])
        .select();
      if (error) throw error;

      setReviews((prev) => [...prev, data[0]]);
      setMessage("Review added successfully!");
      setNewReview({ name: "", company: "", image_url: "", content: "" });
    } catch (err) {
      console.error("Error adding review:", err);
      setError(err.message);
    }
  };

  // Delete review
  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMessage("Review deleted successfully!");
    } catch (err) {
      console.error("Error deleting review:", err);
      setError(err.message);
    }
  };

  // Update review
  const handleUpdateReview = async (id) => {
    try {
      const updatedFields = editStates[id];
      const { data, error } = await supabase
        .from("reviews")
        .update(updatedFields)
        .eq("id", id)
        .select();
      if (error) throw error;

      setReviews((prev) => prev.map((r) => (r.id === id ? data[0] : r)));
      setMessage("Review updated successfully!");
    } catch (err) {
      console.error("Error updating review:", err);
      setError(err.message);
    }
  };

  return (
    <>
      <Nav />
      <div className="admin-reviews-page">
        <h1>Admin Reviews Dashboard</h1>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {/* Add new review */}
        <div className="review-form">
          <h2>Add New Review</h2>
          <input
            type="text"
            placeholder="Name"
            value={newReview.name}
            onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Company"
            value={newReview.company}
            onChange={(e) => setNewReview({ ...newReview, company: e.target.value })}
          />
          <input
            type="text"
            placeholder="Photo URL (optional)"
            value={newReview.image_url}
            onChange={(e) => setNewReview({ ...newReview, image_url: e.target.value })}
          />
          <textarea
            placeholder="Review text"
            value={newReview.content}
            onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
          />
          <button onClick={handleAddReview}>Add Review</button>
        </div>

        {/* Existing reviews */}
        <div className="review-list">
          <h2>Existing Reviews</h2>
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews found.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-image-preview">
                  <img
                    src={editStates[r.id]?.image_url || DEFAULT_PHOTO}
                    alt={`${r.name} preview`}
                    onError={(e) => (e.currentTarget.src = DEFAULT_PHOTO)}
                  />
                </div>

                <input
                  type="text"
                  value={editStates[r.id]?.name || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({ ...prev, [r.id]: { ...prev[r.id], name: e.target.value } }))
                  }
                />
                <input
                  type="text"
                  value={editStates[r.id]?.company || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({ ...prev, [r.id]: { ...prev[r.id], company: e.target.value } }))
                  }
                />
                <input
                  type="text"
                  value={editStates[r.id]?.image_url || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({ ...prev, [r.id]: { ...prev[r.id], image_url: e.target.value } }))
                  }
                />
                <textarea
                  value={editStates[r.id]?.content || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({ ...prev, [r.id]: { ...prev[r.id], content: e.target.value } }))
                  }
                />
                <button onClick={() => handleUpdateReview(r.id)}>Update</button>
                <button onClick={() => handleDeleteReview(r.id)}>Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}