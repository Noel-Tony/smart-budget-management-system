import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Filler
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { MdTrendingUp, MdTrendingDown, MdAccountBalance, MdAdd } from 'react-icons/md';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const CATEGORY_COLORS = [
  '#4ade80','#60a5fa','#f87171','#fbbf24','#a78bfa',
  '#34d399','#fb923c','#38bdf8','#f472b6','#a3e635'
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, summaryRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/transactions/summary/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      ]);
      setData({ analytics: analyticsRes.data, summary: summaryRes.data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 400 }}>
      <div className="spinner" />
    </div>
  );

  const { analytics } = data || {};
  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const trendData = analytics?.trendData || [];
  const currentMonth = analytics?.currentMonth || {};

  // Doughnut chart
  const doughnutData = {
    labels: categoryBreakdown.slice(0, 8).map(c => c._id),
    datasets: [{
      data: categoryBreakdown.slice(0, 8).map(c => c.total),
      backgroundColor: CATEGORY_COLORS,
      borderColor: 'transparent',
      hoverOffset: 6,
    }]
  };

  // Bar chart — last 6 months
  const last6 = trendData.slice(-6);
  const barData = {
    labels: last6.map(t => {
      const [y, m] = t.month.split('-');
      return new Date(y, m - 1).toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      { label: 'Income', data: last6.map(t => t.income), backgroundColor: 'rgba(74,222,128,0.7)', borderRadius: 6 },
      { label: 'Expense', data: last6.map(t => t.expense), backgroundColor: 'rgba(248,113,113,0.7)', borderRadius: 6 },
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: 'var(--text-2)', font: { family: 'Roboto', size: 13, weight: 500 } } } },
    scales: {
      x: { ticks: { color: 'var(--text-3)', font: { family: 'Roboto' } }, grid: { display: false } },
      y: { 
        ticks: { color: 'var(--text-3)', font: { family: 'Roboto' }, callback: v => `₹${v/1000}k` }, 
        grid: { color: 'var(--border-2)', tickLength: 0 },
        border: { display: false }
      }
    }
  };

  const budgetUsed = user?.monthlyBudget ? (currentMonth.expense / user.monthlyBudget) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })} — Financial Overview
          </p>
        </div>
        <Link to="/transactions" className="btn btn-primary">
          <MdAdd /> Add Transaction
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{fmt(analytics?.overview?.totalIncome)}</div>
          <div className="stat-sub">This month: {fmt(currentMonth.income)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value">{fmt(analytics?.overview?.totalExpense)}</div>
          <div className="stat-sub">This month: {fmt(currentMonth.expense)}</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value">{fmt(analytics?.overview?.balance)}</div>
          <div className="stat-sub">Month: {fmt(currentMonth.balance)}</div>
        </div>
        <div className="stat-card budget">
          <div className="stat-label">Monthly Budget</div>
          <div className="stat-value">{fmt(user?.monthlyBudget)}</div>
          <div className="stat-sub">{budgetUsed.toFixed(0)}% used this month</div>
          {user?.monthlyBudget > 0 && (
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{
                width: `${Math.min(budgetUsed, 100)}%`,
                background: budgetUsed > 90 ? 'var(--danger)' : budgetUsed > 70 ? 'var(--warning)' : 'var(--accent)'
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        <div className="card span-full">
          <div className="card-header">
            <span className="card-title"><MdTrendingUp style={{ marginRight: 8 }} />Income vs Expense (Last 6 Months)</span>
          </div>
          <Bar data={barData} options={chartOptions} height={80} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><MdTrendingDown style={{ marginRight: 8 }} />Spending by Category</span>
          </div>
          {categoryBreakdown.length > 0 ? (
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
              <Doughnut data={doughnutData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'DM Sans' }, padding: 12, boxWidth: 12 } }
                }
              }} />
            </div>
          ) : (
            <div className="empty-state"><p>No expense data yet</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><MdAccountBalance style={{ marginRight: 8 }} />Category Breakdown</span>
          </div>
          {categoryBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryBreakdown.slice(0, 6).map((cat, i) => {
                const pct = analytics?.currentMonth?.expense > 0 ? (cat.total / analytics.currentMonth.expense) * 100 : 0;
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cat._id}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(cat.total)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: CATEGORY_COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><p>No expenses this month</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
