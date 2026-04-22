import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdSave, MdAccountBalanceWallet } from 'react-icons/md';

const EXPENSE_CATEGORIES = [
  'Food & Dining','Travel & Transport','Entertainment','Education',
  'Shopping','Health & Medical','Utilities','Rent & Housing','Other Expense'
];

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Budget() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryLimits, setCategoryLimits] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetRes, summaryRes] = await Promise.all([
        api.get(`/budget?month=${month}&year=${year}`),
        api.get(`/transactions/summary/monthly?month=${month}&year=${year}`)
      ]);
      const b = budgetRes.data.budget;
      setBudget(b);
      setSummary(summaryRes.data);
      if (b) {
        setTotalBudget(b.totalBudget);
        const limits = {};
        b.categoryLimits?.forEach(cl => { limits[cl.category] = cl.limit; });
        setCategoryLimits(limits);
      } else {
        setTotalBudget('');
        setCategoryLimits({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year]); // eslint-disable-line

  const handleSave = async () => {
    if (!totalBudget) { toast.error('Enter a total budget'); return; }
    setSaving(true);
    try {
      const categoryLimitsArr = Object.entries(categoryLimits)
        .filter(([, v]) => v > 0)
        .map(([category, limit]) => ({ category, limit: Number(limit) }));
      await api.post('/budget', { month, year, totalBudget: Number(totalBudget), categoryLimits: categoryLimitsArr });
      toast.success('Budget saved!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const getCategorySpending = (cat) => {
    return summary?.categoryBreakdown?.find(c => c._id === cat)?.total || 0;
  };

  const totalSpent = summary?.categoryBreakdown?.reduce((s, c) => s + c.total, 0) || 0;
  const budgetNum = Number(totalBudget) || 0;
  const overallPct = budgetNum > 0 ? (totalSpent / budgetNum) * 100 : 0;

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Budget Planner</h2>
          <p className="page-subtitle">Set and track your monthly spending limits</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 140 }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 90 }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : (
        <div className="grid-2">
          {/* Left: Set Budget */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title"><MdAccountBalanceWallet style={{ marginRight: 8 }} />Total Monthly Budget</span>
              </div>
              <div className="form-group">
                <label className="form-label">Budget Amount (₹)</label>
                <input className="form-input" type="number" placeholder="e.g. 15000" min="0"
                  value={totalBudget} onChange={e => setTotalBudget(e.target.value)} />
              </div>

              {budgetNum > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overall Usage</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: overallPct > 90 ? 'var(--danger)' : overallPct > 70 ? 'var(--warning)' : 'var(--accent)' }}>
                      {fmt(totalSpent)} / {fmt(budgetNum)} ({overallPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(overallPct, 100)}%`,
                      background: overallPct > 90 ? 'var(--danger)' : overallPct > 70 ? 'var(--warning)' : 'var(--accent)'
                    }} />
                  </div>
                  {overallPct > 90 && (
                    <div className="alert alert-danger" style={{ marginTop: 12 }}>
                      ⚠️ You've used over 90% of your monthly budget!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Category Limits</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Set optional spending caps for each category.
              </p>
              {EXPENSE_CATEGORIES.map(cat => (
                <div className="form-group" key={cat} style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>{cat}</label>
                  <input className="form-input" type="number" placeholder="No limit" min="0"
                    value={categoryLimits[cat] || ''} onChange={e => setCategoryLimits({ ...categoryLimits, [cat]: e.target.value })} />
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><MdSave /> Save Budget</>}
              </button>
            </div>
          </div>

          {/* Right: Tracking */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Category Spending — {months[month - 1]} {year}</span>
            </div>
            {EXPENSE_CATEGORIES.map(cat => {
              const spent = getCategorySpending(cat);
              const limit = Number(categoryLimits[cat]) || 0;
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--accent)';

              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {fmt(spent)}{limit > 0 ? ` / ${fmt(limit)}` : ''}
                    </span>
                  </div>
                  {limit > 0 ? (
                    <>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                      {pct > 100 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>
                          Over limit by {fmt(spent - limit)}!
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3 }}>
                      {spent > 0 && <div style={{ height: '100%', width: '40%', background: 'var(--border-light)', borderRadius: 3 }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
