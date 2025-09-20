// src/Layouts/AdminLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import './AdminLayout.scss';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="title">Admin</h2>
        <nav>
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/videos">Videos</NavLink>
          <NavLink to="/admin/reviews">Reviews</NavLink>
          <NavLink to="/admin/pricing">Pricing</NavLink>
          <NavLink to="/admin/misc">Misc</NavLink>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet /> {/* Nested route content will render here */}
      </main>
    </div>
  );
}

export default AdminLayout;