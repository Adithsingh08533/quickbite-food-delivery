import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { OwnerLayout } from './components/layout/OwnerLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Customer Pages
import { Home } from './pages/customer/Home';
import { RestaurantDetail } from './pages/customer/RestaurantDetail';
import { Checkout } from './pages/customer/Checkout';
import { OrderHistory } from './pages/customer/OrderHistory';
import { Favorites } from './pages/customer/Favorites';

// Owner Pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { MenuManager } from './pages/owner/MenuManager';
import { OrderManager } from './pages/owner/OrderManager';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Approvals } from './pages/admin/Approvals';

// Error Pages
import { NotFound } from './pages/NotFound';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they go somewhere they shouldn't
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export const App = () => {
  const { isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrderHistory />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Favorites />
            </ProtectedRoute>
          } />
        </Route>

        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OwnerDashboard />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="orders" element={<OrderManager />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="approvals" element={<Approvals />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
