import React, { useEffect, useState } from "react";
import { supabaseAdmin as supabase } from "../../utils/supabaseAdmin";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import "./AdminPhotoCategoriesPage.scss";

export default function AdminPhotoCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    thumbnail_url: "",
    visible_on_hub: true,
  });

  const [edits, setEdits] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("image_categories")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("[AdminPhotoCategoriesPage] Fetch error:", err);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;

    const slug = newCategory.name.trim().toLowerCase().replace(/\s+/g, "-");

    try {
      const { error } = await supabase
        .from("image_categories")
        .insert([{ ...newCategory, slug }]);
      if (error) throw error;

      setNewCategory({ name: "", thumbnail_url: "", visible_on_hub: true });
      fetchCategories();
      triggerButtonStatus("add-category", "Added!");
    } catch (err) {
      console.error("[AdminPhotoCategoriesPage] Add error:", err);
      setError("Failed to add category");
    }
  };

  const handleEditChange = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (id) => {
    const updateData = edits[id];
    if (!updateData) return;

    try {
      const { error } = await supabase
        .from("image_categories")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      fetchCategories();
      triggerButtonStatus(`update-${id}`, "Updated!");
    } catch (err) {
      console.error("[AdminPhotoCategoriesPage] Update error:", err);
      setError("Failed to update category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? This may orphan images."))
      return;

    try {
      const { error } = await supabase
        .from("image_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchCategories();
      triggerButtonStatus(`delete-${id}`, "Deleted!");
    } catch (err) {
      console.error("[AdminPhotoCategoriesPage] Delete error:", err);
      setError("Failed to delete category");
    }
  };

  const [buttonStatus, setButtonStatus] = useState({});

  const triggerButtonStatus = (key, label = "Done", duration = 1500) => {
    setButtonStatus((prev) => ({ ...prev, [key]: label }));
    setTimeout(() => {
      setButtonStatus((prev) => ({ ...prev, [key]: null }));
    }, duration);
  };
  return (
    <>
      <Nav />
      <div className="admin-photo-categories-page">
        <h1 className="admin-photo-categories-page__title">
          Admin: Photo Categories
        </h1>

        {error && <p className="admin-photo-categories-page__error">{error}</p>}
        {loading && (
          <p className="admin-photo-categories-page__loading">
            Loading categories...
          </p>
        )}

        <form
          onSubmit={handleAdd}
          className="admin-photo-categories-page__form category-form"
        >
          <input
            type="text"
            className="category-form__input"
            placeholder="Name"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            required
          />

          <input
            type="text"
            className="category-form__input"
            placeholder="Thumbnail URL"
            value={newCategory.thumbnail_url}
            onChange={(e) =>
              setNewCategory({ ...newCategory, thumbnail_url: e.target.value })
            }
          />
          <label className="category-form__checkbox-label">
            <input
              type="checkbox"
              className="category-form__checkbox"
              checked={newCategory.visible_on_hub}
              onChange={(e) =>
                setNewCategory({
                  ...newCategory,
                  visible_on_hub: e.target.checked,
                })
              }
            />
            Visible on Hub
          </label>
          <button type="submit" className="category-form__submit-btn">
            {buttonStatus["add-category"] || "Add Category"}
          </button>
        </form>

        {categories.length ? (
          <table className="admin-photo-categories-page__table categories-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Visible on Hub</th>
                <th>Thumbnail URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const draft = edits[cat.id] || {};
                return (
                  <tr key={cat.id} className="categories-table__row">
                    <td className="categories-table__cell">
                      <input
                        className="categories-table__input"
                        value={draft.name ?? cat.name}
                        onChange={(e) =>
                          handleEditChange(cat.id, "name", e.target.value)
                        }
                      />
                    </td>
                    <td className="categories-table__cell">
                      <input
                        type="checkbox"
                        className="categories-table__checkbox"
                        checked={
                          draft.visible_on_hub ?? cat.visible_on_hub ?? false
                        }
                        onChange={(e) =>
                          handleEditChange(
                            cat.id,
                            "visible_on_hub",
                            e.target.checked,
                          )
                        }
                      />
                    </td>
                    <td className="categories-table__cell">
                      <input
                        className="categories-table__input"
                        value={(draft.thumbnail_url ?? cat.thumbnail_url) || ""}
                        onChange={(e) =>
                          handleEditChange(
                            cat.id,
                            "thumbnail_url",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="categories-table__cell categories-table__actions">
                      <button
                        className="categories-table__update-btn"
                        onClick={() => handleUpdate(cat.id)}
                      >
                        {buttonStatus[`update-${cat.id}`] || "Update"}
                      </button>
                      <button
                        className="categories-table__delete-btn"
                        onClick={() => handleDelete(cat.id)}
                      >
                        {buttonStatus[`delete-${cat.id}`] || "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="admin-photo-categories-page__empty">
            No categories yet. Add one above.
          </p>
        )}
      </div>

      <Footer />
    </>
  );
}
