import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdClose, MdCheck } from 'react-icons/md';

const EXPENSE_CATS = [
  { label: 'Food',    icon: '🍔', value: 'Food & Dining' },
  { label: 'Travel',  icon: '🚌', value: 'Travel & Transport' },
  { label: 'Study',   icon: '📚', value: 'Education' },
  { label: 'Health',  icon: '💊', value: 'Health & Medical' },
  { label: 'Shop',    icon: '🛍️', value: 'Shopping' },
  { label: 'Fun',     icon: '🎬', value: 'Entertainment' },
  { label: 'Bills',   icon: '💡', value: 'Utilities' },
  { label: 'Rent',    icon: '🏠', value: 'Rent & Housing' },
  { label: 'Other',   icon: '📦', value: 'Other Expense' },
];

const INCOME_CATS = [
  { label: 'Salary',  icon: '💼', value: 'Salary & Stipend' },
  { label: 'Part-time', icon: '🧑‍💻', value: 'Part-time Job' },
  { label: 'Scholar', icon: '🎓', value: 'Scholarship' },
  { label: 'Family',  icon: '🏡', value: 'Family Support' },
  { label: 'Other',   icon: '💰', value: 'Other Income' },
];

// Smart parser: "250 food" → { amount: 250, category: 'Food & Dining' }
function parseQuick(text) {
  if (!text.trim()) return null;
  const parts   = text.trim().split(/\s+/);
  const num     = parseFloat(parts[0]);
  if (isNaN(num)) return null;
  const keyword = parts.slice(1).join(' ').toLowerCase();
  const allCats = [...EXPENSE_CATS, ...INCOME_CATS];
  const match   = allCats.find(c =>
    c.label.toLowerCase().includes(keyword) ||
    c.value.toLowerCase().includes(keyword) ||
    keyword.includes(c.label.toLowerCase())
  );
  return { amount: num, category: match?.value || '' };
}

export default function QuickAdd({ onClose, onSuccess }) {
  const [type,     setType]     = useState('expense');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [notes,    setNotes]    = useState('');
  const [quick,    setQuick]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);

  const amountRef = useRef(null);

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 80);
  }, []);

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  const handleQuick = e => {
    const val = e.target.value;
    setQuick(val);
    const parsed = parseQuick(val);
    if (parsed) {
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!category) { toast.error('Pick a category'); return; }
    setSaving(true);
    try {
      await api.post('/transactions', { type, amount: Number(amount), category, date, description: notes });
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 900);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-soft)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: 'var(--green)' }}>
              <MdCheck />
            </div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', marginBottom: 6 }}>Added successfully!</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text-3)' }}>Your transaction has been recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="modal-header">
              <h3 className="modal-title">Own Entry</h3>
              <button type="button" className="btn-icon" onClick={onClose}><MdClose /></button>
            </div>

            {/* Quick parse bar */}
            <div className="quick-bar">
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <input
                placeholder='Try: "250 food" or "1500 travel"'
                value={quick}
                onChange={handleQuick}
              />
              <span className="quick-bar-hint">smart fill</span>
            </div>

            {/* Type toggle */}
            <div className="type-toggle">
              <button type="button" className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => { setType('expense'); setCategory(''); }}>
                💸 Expense
              </button>
              <button type="button" className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
                onClick={() => { setType('income'); setCategory(''); }}>
                💰 Income
              </button>
            </div>

            {/* Amount */}
            <div className="amount-display">
              <span className="currency">₹</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0.01" step="0.01"
              />
            </div>

            {/* Category chips */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="cat-chips">
                {cats.map(c => (
                  <button key={c.value} type="button"
                    className={`cat-chip ${category === c.value ? 'selected' : ''}`}
                    onClick={() => setCategory(c.value)}>
                    <span className="cat-chip-icon">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" type="text" placeholder="What for?" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }} disabled={saving}>
              {saving
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : `Save ${type === 'expense' ? 'Expense' : 'Income'}`
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
