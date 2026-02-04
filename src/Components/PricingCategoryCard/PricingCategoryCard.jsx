import "./PricingCategoryCard.scss";
export default function PricingCategoryCard({
  name,
  description,
  thumbnail_url,
}) {
  return (
    <div className="pricing-category-card">
      <img src={thumbnail_url} alt={name} className="category-thumbnail" />
      <div className="category-content">
        <h2 className="category-name">{name}</h2>
        {description && <p className="category-description">{description}</p>}
      </div>
    </div>
  );
}
