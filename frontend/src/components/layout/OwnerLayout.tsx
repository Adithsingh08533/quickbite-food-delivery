import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Menu, ListOrdered, LogOut, Utensils, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './OwnerLayout.css';

export const OwnerLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="owner-layout">
      {/* Sidebar */}
      <aside className="owner-sidebar">
        <Link to="/" className="owner-brand">
          <Utensils size={24} />
          QuickBite Partner
        </Link>
        
        <nav className="owner-nav">
          <NavLink 
            to="/owner" 
            end
            className={({ isActive }) => `owner-nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/owner/orders" 
            className={({ isActive }) => `owner-nav-link ${isActive ? 'active' : ''}`}
          >
            <ListOrdered size={20} />
            Order Management
          </NavLink>
          <NavLink 
            to="/owner/menu" 
            className={({ isActive }) => `owner-nav-link ${isActive ? 'active' : ''}`}
          >
            <Menu size={20} />
            Menu Builder
          </NavLink>
        </nav>
        
        <div className="owner-footer">
          <button className="owner-logout" onClick={handleLogout}>
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="owner-main">
        {/* Header */}
        <header className="owner-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome, {user?.name.split(' ')[0]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ color: 'var(--text-secondary)', position: 'relative' }}>
              <Bell size={24} />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: 'var(--error)', borderRadius: '50%', border: '2px solid white' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name.charAt(0)}
              </div>
              <span style={{ fontWeight: 500 }}>{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="owner-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
