import { NavLink, useNavigate } from "react-router-dom";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Sidebar(){
  const navigate = useNavigate();
  return (
    <aside className="admin-sidebar">
      <div className="brand"><span className="dot" /> Admin Panel</div>
      <nav className="nav">
        <NavLink to="/admin" end className={({isActive})=>isActive?"active":undefined}>Dashboard</NavLink>
        <NavLink to="/admin/thesis" className={({isActive})=>isActive?"active":undefined}>Thesis</NavLink>
        <NavLink to="/admin/users" className={({isActive})=>isActive?"active":undefined}>Users</NavLink>
      </nav>
      <div className="sidebar-spacer" />
      <button
        className="logout"
        onClick={() =>
          fetch(`${API}/api/auth/logout`, { method:"POST", credentials:"include" })
            .finally(()=>navigate("/login", { replace:true }))
        }
      >
        Logout
      </button>
    </aside>
  );
}
