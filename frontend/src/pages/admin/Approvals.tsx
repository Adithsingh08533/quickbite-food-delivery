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

  if (loading) return <div>Loading pending approvals...</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Pending Approvals</h1>

      {pendingRestaurants.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Store size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3>All caught up!</h3>
          <p>There are no pending restaurant applications to review at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {pendingRestaurants.map(r => (
            <div key={r.id} className="dashboard-card animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.name}</h3>
                
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} /> <span>{r.ownerName || 'Unknown Owner'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} /> <span>{r.ownerEmail || 'No email provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} /> <span>{r.ownerPhone || r.phone || 'No phone provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> <span>{r.address}, {r.city}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Registered on {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleApproval(r.id, 'reject')}>
                  <X size={18} /> Reject
                </Button>
                <Button style={{ background: 'var(--success)', color: 'white' }} onClick={() => handleApproval(r.id, 'approve')}>
                  <Check size={18} /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <h2 style={{ fontSize: '1.25rem', margin: '3rem 0 1.5rem', color: 'var(--text-secondary)' }}>Recently Reviewed</h2>
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Restaurant</th>
              <th style={{ padding: '1rem 1.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.filter(r => r.approvalStatus !== 'pending').slice(0, 10).map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.address}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                    background: r.approvalStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                    color: r.approvalStatus === 'approved' ? '#16a34a' : '#ef4444'
                  }}>
                    {r.approvalStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
