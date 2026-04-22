import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdPerson, MdAccountBalanceWallet } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', monthlyBudget: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, Number(form.monthlyBudget) || 0);
      toast.success('Account created! Welcome to Smart Budget 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>Smart Budget</h1>
          <p>Create your management system account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <MdPerson style={iconStyle} />
              <input className="form-input" type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ paddingLeft: 40 }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <MdEmail style={iconStyle} />
              <input className="form-input" type="email" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 40 }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock style={iconStyle} />
              <input className="form-input" type="password" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 40 }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Budget (₹) — optional</label>
            <div style={{ position: 'relative' }}>
              <MdAccountBalanceWallet style={iconStyle} />
              <input className="form-input" type="number" placeholder="e.g. 10000"
                value={form.monthlyBudget} onChange={e => setForm({ ...form, monthlyBudget: e.target.value })}
                style={{ paddingLeft: 40 }} min="0" />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
