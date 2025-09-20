import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Link } from "react-router-dom";
import PricingCategoryCard from "../../Components/PricingCategoryCard/PricingCategoryCard";
import './PricingPage.scss'
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

export default function PricingPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("pricing_categories")
        .select("id, name, slug, description, thumbnail_url")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
    <Nav/>
    
    <div className="pricing-page">
      <h1 className="title">Packages</h1>
      <div className="categories-grid">
        {categories.map((cat) => (
          <Link key={cat.id} to={`/packages/${cat.slug}`}>
            <PricingCategoryCard {...cat} />
          </Link>
        ))}
      </div>
    </div>
    <Footer/>
    </>
  );
}