import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ExportPanel from '../components/ExportPanel';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose } from 'react-icons/md';

const CATEGORIES = {
  expense: ['Food & Dining','Travel & Transport','Entertainment','Education','Shopping','Health & Medical','Utilities','Rent & Housing','Other Expense'],
  income:  ['Salary & Stipend','Part-time Job','Scholarship','Family Support','Other Income']
};

const fmt     = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const emptyForm = { type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], isRecurring: false };

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [allTx, setAllTx] = useState([]);           // for export
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx]       = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filters, setFilters]     = useState({ type: '', category: '', search: '' });
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.type)     params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      const res = await api.get(`/transactions?${params}`);
      let txs = res.data.transactions;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        txs = txs.filter(t => t.description?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
      }
      setTransactions(txs);
      setTotalPages(res.data.pages || 1);
    } catch (err) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  // Fetch all transactions (no pagination) for export
  const fetchAllTx = useCallback(async () => {
    try {
      const res = await api.get('/transactions?limit=1000');
      setAllTx(res.data.transactions);
    } catch {}
  }, []);

  useEffect(() => { fetchTransactions(); fetchAllTx(); }, [fetchTransactions, fetchAllTx]);

  const openAdd  = () => { setEditTx(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = tx => {
    setEditTx(tx);
    setForm({ type: tx.type, amount: tx.amount, category: tx.category,
      description: tx.description || '', isRecurring: tx.isRecurring,
      date: new Date(tx.date).toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.amount || !form.category) { toast.error('Amount and category are required'); return; }
    setSaving(true);
    try {
      if (editTx) { await api.put(`/transactions/${editTx._id}`, form); toast.success('Updated!'); }
      else        { await api.post('/transactions', form); toast.success('Added!'); }
      setShowModal(false);
      fetchTransactions(); fetchAllTx();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTransactions(); fetchAllTx();
    } catch { toast.error('Failed to delete'); }
  };

  const allCategories = [...CATEGORIES.expense, ...CATEGORIES.income];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Transactions</h2>
          <p className="page-subtitle">Manage your income and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Transaction</button>
      </div>

      {/* Export Panel */}
      <ExportPanel transactions={allTx} user={user} />

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search..." style={{ paddingLeft: 36 }}
            value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="form-input" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value, category: '' })}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="form-input" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filters.type || filters.category || filters.search) && (
          <button className="btn btn-ghost" onClick={() => setFilters({ type: '', category: '', search: '' })}>
            <MdClose /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><MdAdd /><p>No transactions found. Add your first one!</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Description</th>
                  <th>Type</th><th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmtDate(tx.date)}</td>
                    <td><span className="badge badge-category">{tx.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${tx.type}`}>
                        <span className={`type-dot ${tx.type}`} />
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-display)', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn-icon" onClick={() => openEdit(tx)}><MdEdit /></button>
                        <button className="btn-icon" onClick={() => handleDelete(tx._id)} style={{ color: 'var(--red)' }}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`btn ${page === i+1 ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 12px', minWidth: 36 }} onClick={() => setPage(i+1)}>
                {i+1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['expense','income'].map(t => (
                    <button key={t} type="button"
                      className={`btn ${form.type === t ? (t === 'income' ? 'btn-primary' : 'btn-danger') : 'btn-ghost'}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setForm({ ...form, type: t, category: '' })}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-input" type="number" placeholder="0.00" min="0.01" step="0.01"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" type="text" placeholder="What was this for?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (editTx ? 'Update' : 'Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
