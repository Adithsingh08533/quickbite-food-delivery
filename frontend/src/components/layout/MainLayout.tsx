import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      
      {/* Simple Footer */}
      <footer style={{ 
        backgroundColor: 'var(--surface-color)', 
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>QuickBite</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Delivering happiness, one meal at a time.
            </p>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} QuickBite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
