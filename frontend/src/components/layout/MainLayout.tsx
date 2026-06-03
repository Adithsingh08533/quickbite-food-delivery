import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-surface border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <span className="text-xl font-bold text-primary">QuickBite</span>
            <p className="text-text-secondary text-sm mt-2">
              Delivering happiness, one meal at a time.
            </p>
          </div>
          <div className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} QuickBite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

