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

  const [editStates, setEditStates] = useState({});
  const [buttonStatus, setButtonStatus] = useState({});

  const triggerButtonStatus = (key, label = "Done", duration = 1500) => {
    setButtonStatus((prev) => ({ ...prev, [key]: label }));
    setTimeout(() => {
      setButtonStatus((prev) => ({ ...prev, [key]: null }));
    }, duration);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setReviews(data);

      const initialEdits = {};
      data.forEach((r) => {
        initialEdits[r.id] = { ...r };
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
      setEditStates((prev) => ({ ...prev, [data[0].id]: data[0] }));
      setNewReview({ name: "", company: "", image_url: "", content: "" });
      setMessage("Review added successfully!");
      triggerButtonStatus("add-review", "Added!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleUpdateReview = async (id) => {
    try {
      const updatedFields = {
        ...editStates[id],
        image_url: editStates[id].image_url || DEFAULT_PHOTO,
      };

      const { data, error } = await supabase
        .from("reviews")
        .update(updatedFields)
        .eq("id", id)
        .select();
      if (error) throw error;

      setReviews((prev) => prev.map((r) => (r.id === id ? data[0] : r)));
      setEditStates((prev) => ({ ...prev, [id]: data[0] }));
      setMessage("Review updated successfully!");
      triggerButtonStatus(`update-review-${id}`, "Updated!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== id));
      setEditStates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setMessage("Review deleted successfully!");
      triggerButtonStatus(`delete-review-${id}`, "Deleted!");
    } catch (err) {
      console.error(err);
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

        <h2>Add New Review</h2>
        <div className="review-form">
          <input
            type="text"
            placeholder="Name"
            value={newReview.name}
            onChange={(e) =>
              setNewReview({ ...newReview, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Company"
            value={newReview.company}
            onChange={(e) =>
              setNewReview({ ...newReview, company: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Photo URL (optional)"
            value={newReview.image_url}
            onChange={(e) =>
              setNewReview({ ...newReview, image_url: e.target.value })
            }
          />
          <textarea
            placeholder="Review text"
            value={newReview.content}
            onChange={(e) =>
              setNewReview({ ...newReview, content: e.target.value })
            }
          />
          <button onClick={handleAddReview}>
            {buttonStatus["add-review"] || "Add Review"}
          </button>
        </div>

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
                    setEditStates((prev) => ({
                      ...prev,
                      [r.id]: { ...prev[r.id], name: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  value={editStates[r.id]?.company || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({
                      ...prev,
                      [r.id]: { ...prev[r.id], company: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  value={editStates[r.id]?.image_url || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({
                      ...prev,
                      [r.id]: { ...prev[r.id], image_url: e.target.value },
                    }))
                  }
                />
                <textarea
                  value={editStates[r.id]?.content || ""}
                  onChange={(e) =>
                    setEditStates((prev) => ({
                      ...prev,
                      [r.id]: { ...prev[r.id], content: e.target.value },
                    }))
                  }
                />

                <button
                  className="update-button"
                  onClick={() => handleUpdateReview(r.id)}
                >
                  {buttonStatus[`update-review-${r.id}`] || "Update"}
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteReview(r.id)}
                >
                  {buttonStatus[`delete-review-${r.id}`] || "Delete"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
