import './PricingPlanCard.scss'


export default function PricingPlanCard({ title, description, price, deliverables }) {
  const deliverablesList = deliverables || [];

  return (
    <div className="pricing-plan-card">
      <h2 className="plan-title">{title}</h2>
      {description && <p className="plan-description">{description}</p>}
      <p className="plan-price">${price}</p>
      {deliverablesList.length > 0 && (
        <ul className="plan-deliverables">
          {deliverablesList.map((d, i) => (
            <li key={i}>
              <span className="checkmark">✔</span> {d}
            </li>
          ))}
        </ul>
      )}
      <button className="select-plan-btn">Select Plan</button>
    </div>
  );
}