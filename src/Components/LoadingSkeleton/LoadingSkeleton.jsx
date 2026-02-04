import "./LoadingSkeleton.scss";

export default function LoadingSkeleton({ count = 4, type = "card" }) {
  if (type === "card") {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-box thumbnail" />
            <div className="skeleton-line title" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <ul className="skeleton-list">
        {Array.from({ length: count }).map((_, idx) => (
          <li key={idx} className="skeleton-line list-item" />
        ))}
      </ul>
    );
  }

  return null;
}
