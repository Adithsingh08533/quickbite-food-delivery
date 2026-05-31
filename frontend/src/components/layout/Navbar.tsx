import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Search, ShoppingBag, LogOut, FileText, LayoutDashboard, Bell, Heart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../ui/Button';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'customer') {
        fetchCart();
      }
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchCart, fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <Utensils size={28} />
          <span>QuickBite</span>
        </Link>

        <nav className="navbar-links">
          {user?.role === 'customer' || !isAuthenticated ? (
            <>
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                <Search size={20} />
                <span>Explore</span>
              </Link>
              
              <Link to="/checkout" className={`navbar-link cart-icon-wrapper ${location.pathname === '/checkout' ? 'active' : ''}`}>
                <ShoppingBag size={20} />
                <span>Cart</span>
                {cartItemsCount > 0 && <span className="cart-badge animate-fade-in">{cartItemsCount}</span>}
              </Link>

              {isAuthenticated && user?.role === 'customer' && (
                <Link to="/orders" className={`navbar-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                  <FileText size={20} />
                  <span>Orders</span>
                </Link>
              )}
            </>
          ) : null}

          {isAuthenticated && user ? (
            <div className="d-flex align-center gap-3">
              <div className="user-menu" ref={notifRef}>
                <button 
                  className="navbar-link cart-icon-wrapper" style={{ background: 'none', border: 'none', padding: 0 }}
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="cart-badge animate-fade-in">{unreadCount}</span>}
                </button>

                {isNotifOpen && (
                  <div className="dropdown-menu notif-dropdown">
                    <div className="dropdown-header d-flex justify-between align-center" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-200)' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.9rem' }}>No notifications yet</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`dropdown-item ${!notif.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              setIsNotifOpen(false);
                            }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-100)', backgroundColor: notif.is_read ? 'transparent' : 'var(--primary-light)', cursor: 'pointer' }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', color: notif.is_read ? 'var(--gray-700)' : 'var(--gray-900)' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{notif.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-menu" ref={dropdownRef}>
              <button 
                className="user-menu-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="user-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span>{user.name.split(' ')[0]}</span>
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {user.role === 'customer' && (
                    <>
                      <Link to="/orders" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FileText size={18} />
                        My Orders
                      </Link>
                      <Link to="/favorites" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <Heart size={18} />
                        Favorites
                      </Link>
                    </>
                  )}
                  {user.role === 'owner' && (
                    <Link to="/owner" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <LayoutDashboard size={18} />
                      Owner Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <LayoutDashboard size={18} />
                      Admin Panel
                    </Link>
                  )}
                  
                  <div className="dropdown-divider" />
                  
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={18} color="var(--error)" />
                    <span style={{ color: 'var(--error)' }}>Logout</span>
                  </button>
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="d-flex align-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
