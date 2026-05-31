import { useState, useEffect } from 'react';
import { Users, Store, CheckSquare, Ban } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userRes, restRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/restaurants')
      ]);
      setUsers(userRes.data?.data?.users || userRes.data?.data || []);
      setRestaurants(restRes.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/${isBanned ? 'unban' : 'ban'}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading admin dashboard...</div>;

  if (error) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)' }}>Error</h2>
        <p>{error}</p>
        <Button onClick={fetchData} style={{ marginTop: '1rem' }}>Retry</Button>
      </div>
    );
  }

  const safeUsers = Array.isArray(users) ? users : [];
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

  const pendingCount = safeRestaurants.filter(r => r?.approvalStatus === 'pending')?.length || 0;
  const activeRestaurantsCount = safeRestaurants.filter(r => r?.approvalStatus === 'approved')?.length || 0;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><Users /></div>
          <div className="stat-info">
            <h4>Total Users</h4>
            <p>{safeUsers?.length || 0}</p>
          </div>
        </div>
        
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><Store /></div>
          <div className="stat-info">
            <h4>Active Restaurants</h4>
            <p>{activeRestaurantsCount}</p>
          </div>
        </div>
        
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><CheckSquare /></div>
          <div className="stat-info">
            <h4>Pending Approvals</h4>
            <p>{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>User Management</h2>
        {safeUsers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Name</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                        background: u.role === 'admin' ? '#f3e8ff' : u.role === 'owner' ? '#dbeafe' : '#f3f4f6',
                        color: u.role === 'admin' ? '#7e22ce' : u.role === 'owner' ? '#1d4ed8' : '#4b5563'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {u.isBanned ? (
                        <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}><Ban size={14} /> Banned</span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      {u.role !== 'admin' && (
                        <Button 
                          size="sm" 
                          variant={u.isBanned ? 'outline' : 'danger'}
                          onClick={() => toggleUserBan(u.id, u.isBanned)}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
