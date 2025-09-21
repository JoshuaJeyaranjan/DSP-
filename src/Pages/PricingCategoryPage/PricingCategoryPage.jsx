import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import PricingPlanCard from "../../Components/PricingPlanCard/PricingPlanCard";
import './PricingCategoryPage.scss'
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

export default function PricingCategoryPage() {
  const { category } = useParams(); // ✅ matches your <Route path="/pricing/:category" />
  const [categoryData, setCategoryData] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!category) return;

    const fetchData = async () => {
      // fetch category by slug
      const { data: catData, error: catError } = await supabase
        .from("pricing_categories")
        .select("*")
        .eq("slug", category)
        .single();

      if (catError) {
        console.error("Error fetching category:", catError);
        return;
      }
      setCategoryData(catData);

      // fetch plans for category
      const { data: planData, error: planError } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("category_id", catData.id)
        .order("price");

      if (planError) {
        console.error("Error fetching plans:", planError);
      } else {
        setPlans(planData);
      }
    };

    fetchData();
  }, [category]);

  if (!categoryData) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <>
    <Nav/>
    <div className="pricing-category-page">
      <div className="category-header">
        <img
          src={categoryData.thumbnail_url}
          alt={categoryData.name}
          className="category-thumbnail"
        />
        <h1 className="category-title">{categoryData.name} Pricing</h1>
        {categoryData.description && (
          <p className="category-description">{categoryData.alt_description}</p>
        )}
      </div>

      {plans.length === 0 ? (
        <p className="no-plans">No plans available yet.</p>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <PricingPlanCard key={plan.id} {...plan} />
          ))}
        </div>
      )}
    </div>
    <Footer/>
    </>
  );
}