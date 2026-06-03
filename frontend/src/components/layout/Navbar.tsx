import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Search, ShoppingBag, LogOut, FileText, LayoutDashboard, Bell, Heart, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const linkClass = mobile 
      ? "flex items-center gap-3 p-3 w-full text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium" 
      : "flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium";
    const activeClass = "text-primary";

    return (
      <>
        {user?.role === 'customer' || !isAuthenticated ? (
          <>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`${linkClass} ${location.pathname === '/' ? activeClass : ''}`}>
              <Search size={20} />
              <span>Explore</span>
            </Link>
            
            <Link to="/checkout" onClick={() => setIsMobileMenuOpen(false)} className={`relative ${linkClass} ${location.pathname === '/checkout' ? activeClass : ''}`}>
              <div className="relative flex items-center">
                <ShoppingBag size={20} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-surface animate-fade-in">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>

            {isAuthenticated && user?.role === 'customer' && (
              <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className={`${linkClass} ${location.pathname === '/orders' ? activeClass : ''}`}>
                <FileText size={20} />
                <span>Orders</span>
              </Link>
            )}
          </>
        ) : null}
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 h-[70px] bg-surface shadow-sm flex items-center">
      <div className="container mx-auto px-4 flex justify-between items-center w-full">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-90 transition-opacity">
          <Utensils size={28} />
          <span>QuickBite</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            <NavLinks />
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <button 
                  className="relative p-2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-surface animate-fade-in">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-border overflow-hidden animate-slide-up origin-top-right z-50">
                    <div className="flex justify-between items-center p-3 border-b border-border">
                      <h4 className="m-0 text-sm font-semibold text-text-primary">Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-text-muted">No notifications yet</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              setIsNotifOpen(false);
                            }}
                            className={`flex flex-col p-3 border-b border-border cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`text-sm mb-1 ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>{notif.title}</div>
                            <div className="text-xs text-text-secondary line-clamp-2">{notif.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden border border-primary/20">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <span className="font-medium text-sm text-text-primary hidden lg:block">{user.name.split(' ')[0]}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border overflow-hidden animate-slide-up origin-top-right z-50">
                    {user.role === 'customer' && (
                      <>
                        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                          <FileText size={16} />
                          My Orders
                        </Link>
                        <Link to="/favorites" className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                          <Heart size={16} />
                          Favorites
                        </Link>
                      </>
                    )}
                    {user.role === 'owner' && (
                      <Link to="/owner" className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutDashboard size={16} />
                        Owner Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <LayoutDashboard size={16} />
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="h-px bg-border my-1" />
                    
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="hidden lg:block">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Toggle & Notifications */}
        <div className="flex items-center gap-4 md:hidden">
          {isAuthenticated && user && (
             <div className="relative" ref={notifRef}>
                <button 
                  className="relative p-2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-surface animate-fade-in">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-surface rounded-lg shadow-xl border border-border overflow-hidden animate-slide-up origin-top-right z-50">
                    <div className="flex justify-between items-center p-3 border-b border-border">
                      <h4 className="m-0 text-sm font-semibold text-text-primary">Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-text-muted">No notifications yet</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              setIsNotifOpen(false);
                            }}
                            className={`flex flex-col p-3 border-b border-border cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`text-sm mb-1 ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>{notif.title}</div>
                            <div className="text-xs text-text-secondary line-clamp-2">{notif.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>
          )}
          
          <button 
            className="p-2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-[70px] left-0 w-full bg-surface border-t border-border shadow-md md:hidden flex flex-col py-2 z-40 animate-slide-up">
          <div className="px-4 py-2 space-y-1">
            <NavLinks mobile={true} />
          </div>
          
          {isAuthenticated && user ? (
            <>
              <div className="h-px bg-border my-2 mx-4" />
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden border border-primary/20">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">{user.name}</div>
                    <div className="text-xs text-text-muted capitalize">{user.role}</div>
                  </div>
                </div>
                
                {user.role === 'customer' && (
                  <>
                    <Link to="/orders" className="flex items-center gap-3 p-3 w-full text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                      <FileText size={18} />
                      My Orders
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-3 p-3 w-full text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                      <Heart size={18} />
                      Favorites
                    </Link>
                  </>
                )}
                {user.role === 'owner' && (
                  <Link to="/owner" className="flex items-center gap-3 p-3 w-full text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} />
                    Owner Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-3 p-3 w-full text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} />
                    Admin Panel
                  </Link>
                )}
                
                <button className="flex w-full items-center gap-3 p-3 mt-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors font-medium" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-2 border-t border-border mt-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
