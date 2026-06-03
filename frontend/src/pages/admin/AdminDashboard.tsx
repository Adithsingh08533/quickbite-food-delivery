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
        api.get('/admin/restaurants?limit=1000')
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

  if (loading) return <div className="p-16 text-center text-text-secondary">Loading admin dashboard...</div>;

  if (error) {
    return (
      <div className="p-16 text-center">
        <h2 className="text-error text-2xl font-bold mb-4">Error</h2>
        <p className="text-text-primary mb-6">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const safeUsers = Array.isArray(users) ? users : [];
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

  const pendingCount = safeRestaurants.filter(r => r?.approvalStatus === 'pending')?.length || 0;
  const activeRestaurantsCount = safeRestaurants.filter(r => r?.approvalStatus === 'approved')?.length || 0;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Total Users</h4>
            <p className="text-2xl font-bold text-text-primary">{safeUsers?.length || 0}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <Store size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Active Restaurants</h4>
            <p className="text-2xl font-bold text-text-primary">{activeRestaurantsCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
            <CheckSquare size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Pending Approvals</h4>
            <p className="text-2xl font-bold text-text-primary">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary m-0">User Management</h2>
        </div>
        {safeUsers.length === 0 ? (
          <p className="p-6 text-text-secondary">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-left text-text-secondary text-sm">
                  <th className="p-4 font-semibold whitespace-nowrap">Name</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Email</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Role</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {safeUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary whitespace-nowrap">{u.name}</td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">{u.email}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide capitalize ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {u.isBanned ? (
                        <span className="text-error flex items-center gap-1.5 text-sm font-medium"><Ban size={14} /> Banned</span>
                      ) : (
                        <span className="text-success text-sm font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
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
