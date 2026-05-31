import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, LogOut, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './OwnerLayout.css'; // Reusing layout CSS

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="owner-layout">
      {/* Sidebar */}
      <aside className="owner-sidebar" style={{ backgroundColor: '#111827' }}>
        <Link to="/" className="owner-brand" style={{ color: '#60a5fa' }}>
          <ShieldAlert size={24} />
          Admin Portal
        </Link>
        
        <nav className="owner-nav">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => `owner-nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? { backgroundColor: '#3b82f6' } : {}}
          >
            <LayoutDashboard size={20} />
            Overview
          </NavLink>
          <NavLink 
            to="/admin/approvals" 
            className={({ isActive }) => `owner-nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? { backgroundColor: '#3b82f6' } : {}}
          >
            <CheckSquare size={20} />
            Pending Approvals
          </NavLink>
        </nav>
        
        <div className="owner-footer">
          <button className="owner-logout" onClick={handleLogout}>
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      <main className="owner-main">
        <header className="owner-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>System Administration</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <span style={{ fontWeight: 500 }}>{user?.name}</span>
          </div>
        </header>

        <div className="owner-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
