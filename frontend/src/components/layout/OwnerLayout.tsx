import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Menu as MenuIcon, ListOrdered, LogOut, Utensils, Bell, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const OwnerLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <Link to="/" className="h-[70px] flex items-center px-6 text-2xl font-bold text-primary border-b border-white/10 gap-2">
        <Utensils size={24} />
        <span className="text-xl">QuickBite Partner</span>
      </Link>
      
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        <NavLink 
          to="/owner" 
          end
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink 
          to="/owner/orders" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <ListOrdered size={20} />
          Order Management
        </NavLink>
        <NavLink 
          to="/owner/menu" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <MenuIcon size={20} />
          Menu Builder
        </NavLink>
      </nav>
      
      <div className="p-6 border-t border-white/10">
        <button 
          className="flex items-center gap-2 w-full px-4 py-2 text-red-300 font-semibold rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500" 
          onClick={handleLogout}
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-4 right-4 lg:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-[70px] bg-surface shadow-sm flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-text-secondary hover:text-primary"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon size={24} />
            </button>
            <h2 className="text-lg lg:text-xl font-semibold truncate hidden sm:block">Welcome, {user?.name.split(' ')[0]}</h2>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative text-text-secondary hover:text-primary">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {user?.name.charAt(0)}
              </div>
              <span className="font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
