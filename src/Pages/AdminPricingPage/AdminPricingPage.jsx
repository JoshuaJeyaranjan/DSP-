import React, { useEffect, useState } from "react";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";
import { createClient } from "@supabase/supabase-js";
import "./AdminPricingPage.scss";

const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;

const supabase = createClient(PROJECT_URL, ANON_KEY);

export default function AdminPricingPage() {
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    thumbnail: "",
  });

  const [categoryEditStates, setCategoryEditStates] = useState({});
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    price: "",
    deliverables: "",
    category_id: null,
  });
  const [planEditStates, setPlanEditStates] = useState({});

  /* ----------------------- FETCH DATA ----------------------- */

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      setCategories(data);

      // Initialize category edit states
      const initialCategoryEdits = {};
      data.forEach((c) => {
        initialCategoryEdits[c.id] = { ...c };
      });
      setCategoryEditStates(initialCategoryEdits);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("price");
      if (error) throw error;
      setPlans(data);

      // Initialize plan edit states
      const initialPlanEdits = {};
      data.forEach((p) => {
        initialPlanEdits[p.id] = {
          ...p,
          deliverables: Array.isArray(p.deliverables)
            ? p.deliverables.join(", ")
            : "",
          price: p.price != null ? p.price.toString() : "",
        };
      });
      setPlanEditStates(initialPlanEdits);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPlans();
  }, []);

  /* ----------------------- CATEGORY CRUD ----------------------- */

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      return setError("Name and slug are required.");
    }

    try {
      const { data, error } = await supabase
        .from("pricing_categories")
        .insert([newCategory])
        .select();
      if (error) throw error;

      setCategories((prev) => [...prev, data[0]]);
      setCategoryEditStates((prev) => ({
        ...prev,
        [data[0].id]: { ...data[0] },
      }));
      setNewCategory({ name: "", slug: "", description: "", thumbnail: "" });
      setMessage("Category added successfully!");
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err.message);
    }
  };

  const handleUpdateCategory = async (id) => {
    const updated = categoryEditStates[id];
    if (!updated.name || !updated.slug) {
      return setError("Name and slug are required.");
    }

    try {
      const { data, error } = await supabase
        .from("pricing_categories")
        .update(updated)
        .eq("id", id)
        .select();
      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? data[0] : c))
      );
      setCategoryEditStates((prev) => ({
        ...prev,
        [id]: data[0],
      }));
      setMessage("Category updated successfully!");
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? This will NOT delete associated plans.")) return;
    try {
      const { error } = await supabase
        .from("pricing_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setCategoryEditStates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setMessage("Category deleted successfully!");
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.message);
    }
  };

  /* ----------------------- PLAN CRUD ----------------------- */

  const handleAddPlan = async () => {
    const { title, price, category_id, deliverables, description } = newPlan;
    if (!title || !price || !category_id) return setError("Title, price, and category are required.");

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0)
      return setError("Price must be a valid positive number.");

    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .insert([{
          title,
          description: description || "",
          price: priceValue,
          deliverables: deliverables ? deliverables.split(",").map(d => d.trim()) : [],
          category_id
        }])
        .select();
      if (error) throw error;

      setPlans((prev) => [...prev, data[0]]);
      setPlanEditStates((prev) => ({
        ...prev,
        [data[0].id]: { ...data[0], price: data[0].price.toString(), deliverables: Array.isArray(data[0].deliverables) ? data[0].deliverables.join(", ") : "" }
      }));
      setNewPlan({ title: "", description: "", price: "", deliverables: "", category_id: null });
      setMessage("Plan added successfully!");
    } catch (err) {
      console.error("Error adding plan:", err);
      setError(err.message);
    }
  };

  const handleUpdatePlan = async (id) => {
    const updated = planEditStates[id];
    const priceValue = parseFloat(updated.price);
    if (isNaN(priceValue) || priceValue < 0) return setError("Price must be a valid positive number.");

    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .update({
          ...updated,
          price: priceValue,
          deliverables: updated.deliverables ? updated.deliverables.split(",").map(d => d.trim()) : [],
        })
        .eq("id", id)
        .select();
      if (error) throw error;

      setPlans((prev) => prev.map((p) => (p.id === id ? data[0] : p)));
      setPlanEditStates((prev) => ({
        ...prev,
        [id]: { ...data[0], price: data[0].price.toString(), deliverables: Array.isArray(data[0].deliverables) ? data[0].deliverables.join(", ") : "" }
      }));
      setMessage("Plan updated successfully!");
    } catch (err) {
      console.error("Error updating plan:", err);
      setError(err.message);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      const { error } = await supabase
        .from("pricing_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setPlans((prev) => prev.filter((p) => p.id !== id));
      setPlanEditStates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setMessage("Plan deleted successfully!");
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError(err.message);
    }
  };

  

  /* ----------------------- RENDER ----------------------- */
  return (
    <>
      <Nav />
      <div className="admin-pricing-page">
        <h1>Admin Pricing Dashboard</h1>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {/* ------------------- CATEGORY CRUD ------------------- */}
        <div className="category-section">
          <h2>Categories</h2>
          <div className="add-category">
            <input type="text" placeholder="Name" value={newCategory.name} onChange={(e)=>setNewCategory({...newCategory, name:e.target.value})} />
            <input type="text" placeholder="Slug" value={newCategory.slug} onChange={(e)=>setNewCategory({...newCategory, slug:e.target.value})} />
            <input type="text" placeholder="Description" value={newCategory.description} onChange={(e)=>setNewCategory({...newCategory, description:e.target.value})} />
            <input type="text" placeholder="Thumbnail URL" value={newCategory.thumbnail} onChange={(e)=>setNewCategory({...newCategory, thumbnail:e.target.value})} />
            <button onClick={handleAddCategory}>Add Category</button>
          </div>

          {categories.map(c => (
            <div className="category-item" key={c.id}>
              <input type="text" value={categoryEditStates[c.id]?.name || ""} onChange={(e)=>setCategoryEditStates(prev=>({...prev,[c.id]:{...prev[c.id], name:e.target.value}}))} />
              <input type="text" value={categoryEditStates[c.id]?.slug || ""} onChange={(e)=>setCategoryEditStates(prev=>({...prev,[c.id]:{...prev[c.id], slug:e.target.value}}))} />
              <input type="text" value={categoryEditStates[c.id]?.description || ""} onChange={(e)=>setCategoryEditStates(prev=>({...prev,[c.id]:{...prev[c.id], description:e.target.value}}))} />
              <input type="text" value={categoryEditStates[c.id]?.thumbnail || ""} onChange={(e)=>setCategoryEditStates(prev=>({...prev,[c.id]:{...prev[c.id], thumbnail:e.target.value}}))} />
              <button onClick={()=>handleUpdateCategory(c.id)}>Update</button>
              <button onClick={()=>handleDeleteCategory(c.id)}>Delete</button>
            </div>
          ))}
        </div>

        {/* ------------------- PLAN CRUD ------------------- */}
        <div className="plan-section">
          <h2>Plans</h2>

          <div className="add-plan">
            <select value={newPlan.category_id || ""} onChange={(e)=>setNewPlan({...newPlan, category_id: Number(e.target.value)})}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Title" value={newPlan.title} onChange={(e)=>setNewPlan({...newPlan,title:e.target.value})} />
            <input type="text" placeholder="Description" value={newPlan.description} onChange={(e)=>setNewPlan({...newPlan,description:e.target.value})} />
            <input type="number" placeholder="Price" step="0.01" value={newPlan.price} onChange={(e)=>setNewPlan({...newPlan,price:e.target.value})} />
            <input type="text" placeholder="Deliverables (comma-separated)" value={newPlan.deliverables} onChange={(e)=>setNewPlan({...newPlan,deliverables:e.target.value})} />
            <button onClick={handleAddPlan}>Add Plan</button>
          </div>

          {loading ? <p>Loading plans...</p> : plans.map(p => (
            <div className="plan-item" key={p.id}>
              <select value={planEditStates[p.id]?.category_id || ""} onChange={(e)=>setPlanEditStates(prev=>({...prev,[p.id]:{...prev[p.id], category_id:Number(e.target.value)}}))}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" value={planEditStates[p.id]?.title || ""} onChange={(e)=>setPlanEditStates(prev=>({...prev,[p.id]:{...prev[p.id], title:e.target.value}}))} />
              <input type="text" value={planEditStates[p.id]?.description || ""} onChange={(e)=>setPlanEditStates(prev=>({...prev,[p.id]:{...prev[p.id], description:e.target.value}}))} />
              <input type="number" step="0.01" value={planEditStates[p.id]?.price || ""} onChange={(e)=>setPlanEditStates(prev=>({...prev,[p.id]:{...prev[p.id], price:e.target.value}}))} />
              <input type="text" value={planEditStates[p.id]?.deliverables || ""} onChange={(e)=>setPlanEditStates(prev=>({...prev,[p.id]:{...prev[p.id], deliverables:e.target.value}}))} />
              <button onClick={()=>handleUpdatePlan(p.id)}>Update</button>
              <button onClick={()=>handleDeletePlan(p.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}