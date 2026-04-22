import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdPerson, MdSave } from 'react-icons/md';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    monthlyBudget: user?.monthlyBudget || '',
    currency: user?.currency || 'INR'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Profile Settings</h2>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Avatar */}
        <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--info))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: '#000', fontFamily: 'var(--font-display)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{user?.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>{user?.email}</p>
          <div style={{ marginTop: 12 }}>
            <span className="badge badge-category">Student Account</span>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><MdPerson style={{ marginRight: 8 }} />Edit Profile</span>
          </div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={user?.email} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</p>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Monthly Budget (₹)</label>
                <input className="form-input" type="number" value={form.monthlyBudget} min="0"
                  onChange={e => setForm({ ...form, monthlyBudget: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', padding: 14 }} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><MdSave /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Account Info</span>
          </div>
          {[
            { label: 'User ID', value: user?._id },
            { label: 'Member Since', value: 'Active Student' },
            { label: 'Monthly Budget', value: `₹${Number(user?.monthlyBudget || 0).toLocaleString('en-IN')}` }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.label}</span>
              <span style={{ fontSize: '0.85rem', fontFamily: item.label === 'User ID' ? 'monospace' : 'inherit', color: 'var(--text-secondary)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
