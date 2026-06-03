import { useState, useEffect } from 'react';
import { Store, Check, X, User, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

export const Approvals = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/restaurants');
      setRestaurants(data.data);
    } catch (err) {
      console.error('Failed to fetch restaurants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      let reason = undefined;
      if (action === 'reject') {
        const input = window.prompt("Please provide a reason for rejection:");
        if (input === null) return; // User cancelled
        reason = input || 'Does not meet platform guidelines.';
      }
      
      await api.patch(`/admin/restaurants/${id}/${action}`, { reason });
      window.alert(`Restaurant successfully ${action}d!`);
      fetchRestaurants();
    } catch (err: any) {
      window.alert(err.message || `Failed to ${action} restaurant`);
    }
  };

  const pendingRestaurants = restaurants.filter(r => r.approvalStatus === 'pending');

  if (loading) return <div className="p-16 text-center text-text-secondary">Loading pending approvals...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-8">Pending Approvals</h1>

      {pendingRestaurants.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-16 text-center text-text-secondary">
          <Store size={48} className="opacity-50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">All caught up!</h3>
          <p>There are no pending restaurant applications to review at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingRestaurants.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-border shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-slide-up hover:shadow-md transition-shadow">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-primary mb-1">{r.name}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 mb-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" /> <span className="font-medium">{r.ownerName || 'Unknown Owner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-primary" /> <span className="font-medium">{r.ownerEmail || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-primary" /> <span className="font-medium">{r.ownerPhone || r.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" /> <span className="font-medium">{r.address}, {r.city}</span>
                  </div>
                </div>

                <div className="text-xs font-medium text-text-muted bg-gray-50 inline-block px-2.5 py-1 rounded">
                  Registered on {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button variant="outline" className="flex-1 md:flex-none justify-center border-error text-error hover:bg-error-bg" onClick={() => handleApproval(r.id, 'reject')}>
                  <X size={18} className="mr-1.5" /> Reject
                </Button>
                <Button className="flex-1 md:flex-none justify-center bg-success text-white hover:bg-success/90" onClick={() => handleApproval(r.id, 'approve')}>
                  <Check size={18} className="mr-1.5" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <h2 className="text-xl font-bold text-text-secondary mt-12 mb-6 border-b border-border pb-2">Recently Reviewed</h2>
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-left text-text-secondary text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Restaurant</th>
                <th className="p-4 font-semibold whitespace-nowrap w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {restaurants.filter(r => r.approvalStatus !== 'pending').length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-text-secondary">No reviewed applications found.</td>
                </tr>
              ) : (
                restaurants.filter(r => r.approvalStatus !== 'pending').slice(0, 10).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-text-primary mb-1">{r.name}</div>
                      <div className="text-sm text-text-secondary">{r.address}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide capitalize ${
                        r.approvalStatus === 'approved' ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
                      }`}>
                        {r.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
