import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ExportPanel from '../components/ExportPanel';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const CAT_COLORS = ['#4f6ef7','#10b981','#f97316','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899','#6b7280'];

const CAT_ICONS = {
  'Food & Dining': '🍔', 'Travel & Transport': '🚌', 'Entertainment': '🎬',
  'Education': '📚', 'Shopping': '🛍️', 'Health & Medical': '💊',
  'Utilities': '💡', 'Rent & Housing': '🏠', 'Other Expense': '📦',
};

function generateInsights(data) {
  const insights = [];
  const { categoryBreakdown = [], currentMonth = {}, overview = {}, trendData = [] } = data;

  if (!categoryBreakdown.length) return insights;

  const top = categoryBreakdown[0];
  const totalExp = currentMonth.expense || 0;
  const budget = overview.monthlyBudget || 0;

  if (top) {
    const pct = totalExp > 0 ? Math.round((top.total / totalExp) * 100) : 0;
    insights.push({ type: 'info', icon: '📊', text: <><strong>{top._id}</strong> is your biggest expense — {pct}% of total spending this month.</> });
  }

  if (budget > 0) {
    const used = Math.round((totalExp / budget) * 100);
    if (used >= 90) insights.push({ type: 'danger', icon: '🚨', text: <><strong>Budget alert!</strong> You've used {used}% of your ₹{budget.toLocaleString('en-IN')} monthly budget.</> });
    else if (used >= 70) insights.push({ type: 'warn', icon: '⚠️', text: <>You've used <strong>{used}%</strong> of your budget. Spend carefully for the rest of the month.</> });
    else insights.push({ type: 'good', icon: '✅', text: <><strong>On track!</strong> Only {used}% of budget used — you have {fmt(budget - totalExp)} left.</> });
  }

  if (trendData.length >= 2) {
    const last = trendData[trendData.length - 1];
    const prev = trendData[trendData.length - 2];
    if (last && prev && prev.expense > 0) {
      const change = Math.round(((last.expense - prev.expense) / prev.expense) * 100);
      if (change > 20) insights.push({ type: 'warn', icon: '📈', text: <>Spending went up <strong>{change}%</strong> compared to last month.</> });
      else if (change < -10) insights.push({ type: 'good', icon: '📉', text: <>Great job! Spending is down <strong>{Math.abs(change)}%</strong> from last month.</> });
    }
  }

  if (categoryBreakdown.length >= 2) {
    const second = categoryBreakdown[1];
    insights.push({ type: 'info', icon: '💡', text: <><strong>{second._id}</strong> is your second largest expense at {fmt(second.total)} this month.</> });
  }

  if (currentMonth.income > 0 && currentMonth.expense > 0) {
    const savings = currentMonth.income - currentMonth.expense;
    if (savings > 0) insights.push({ type: 'good', icon: '💰', text: <>You've saved <strong>{fmt(savings)}</strong> this month — {Math.round((savings / currentMonth.income) * 100)}% of income.</> });
    else insights.push({ type: 'danger', icon: '🔴', text: <><strong>Overspent</strong> by {fmt(Math.abs(savings))} this month. Your expenses exceed income.</> });
  }

  return insights;
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [txs, setTxs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    setLoading(true);
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();
    Promise.all([
      api.get(`/analytics/overview?month=${selectedMonth}&year=${selectedYear}`),
      api.get(`/transactions?limit=1000&startDate=${startDate}&endDate=${endDate}`),
    ]).then(([aRes, tRes]) => {
      setData(aRes.data);
      setTxs(tRes.data.transactions || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedMonth, selectedYear]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  if (!data)   return <div className="empty-state"><p>Failed to load analytics.</p></div>;

  const {
    categoryBreakdown = [], trendData = [], dailySpending = [],
    currentMonth = {}, overview = {}, statistics = {}, regression = {}
  } = data;

  const budget = user?.monthlyBudget || 0;
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((currentMonth.expense / budget) * 100), 100) : 0;
  const savings = currentMonth.income - currentMonth.expense;
  const gaugeColor = budgetUsedPct > 90 ? 'var(--red)' : budgetUsedPct > 70 ? 'var(--amber)' : 'var(--green)';

  // Donut chart
  const donutData = {
    labels: categoryBreakdown.slice(0, 7).map(c => c._id),
    datasets: [{
      data: categoryBreakdown.slice(0, 7).map(c => c.total),
      backgroundColor: CAT_COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  // Line chart — daily spending this month
  const lineLabels = dailySpending.map(d => `${d._id}`);
  const lineValues = dailySpending.map(d => d.total);
  const avgSpend   = lineValues.length ? lineValues.reduce((a, b) => a + b, 0) / lineValues.length : 0;

  const lineData = {
    labels: lineLabels,
    datasets: [{
      label: 'Daily Spending',
      data: lineValues,
      borderColor: '#4f6ef7',
      backgroundColor: 'rgba(79,110,247,0.08)',
      fill: true,
      tension: 0.45,
      pointBackgroundColor: lineValues.map(v => v > avgSpend * 1.5 ? '#ef4444' : '#4f6ef7'),
      pointRadius: lineValues.map(v => v > avgSpend * 1.5 ? 5 : 3),
      pointHoverRadius: 6,
      borderWidth: 2,
    }]
  };

  // Trend & Forecast chart
  const histLabels = trendData.map(t => { const [y, m] = t.month.split('-'); return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short' }); });
  const predLabels = regression?.predictions?.map(p => { const [y, m] = p.month.split('-'); return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); }) || [];
  const trendAllLabels = [...histLabels, ...predLabels];
  const histValues = trendData.map(t => t.expense);
  
  const s1 = [...histValues, ...Array(predLabels.length).fill(null)];
  const s2 = Array(trendAllLabels.length).fill(null);
  const lastHistIdx = Math.max(0, histValues.length - 1);
  if (histValues.length > 0) {
    s2[lastHistIdx] = histValues[lastHistIdx];
    regression?.predictions?.forEach((p, i) => { s2[lastHistIdx + 1 + i] = p.predicted; });
  }

  const forecastLineData = {
    labels: trendAllLabels,
    datasets: [
      {
        label: 'Historical Spending  ',
        data: s1,
        borderColor: 'var(--accent)',
        backgroundColor: 'rgba(37,99,235,0.06)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'var(--accent)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Predicted Forecast',
        data: s2,
        borderColor: 'var(--red)',
        borderDash: [6, 6],
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'var(--red)',
        pointBorderColor: '#fff',
        pointRadius: 5,
        borderWidth: 2,
      }
    ]
  };

  const lineOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${fmt(ctx.raw)}`,
          title: ctx => `Day ${ctx[0].label}`,
        },
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-1)',
        bodyColor: 'var(--text-2)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      x: { ticks: { color: 'var(--text-3)', font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: 'var(--text-3)', font: { size: 11 }, callback: v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` }, grid: { color: 'var(--border)', lineWidth: 0.5 }, border: { display: false } }
    }
  };

  const donutOpts = {
    responsive: true,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct   = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
            return ` ${fmt(ctx.raw)} (${pct}%)`;
          }
        },
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-1)',
        bodyColor: 'var(--text-2)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        padding: 10,
      }
    }
  };

  const totalCatSpend = categoryBreakdown.slice(0, 7).reduce((s, c) => s + c.total, 0);
  const insights = generateInsights({ categoryBreakdown, currentMonth, overview: { ...overview, monthlyBudget: budget }, trendData });
  const recentTxs = txs.slice(0, 5);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">{monthName} — your spending at a glance</p>
        </div>
        <div>
          <select 
            className="form-input" 
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setSelectedYear(parseInt(y));
              setSelectedMonth(parseInt(m));
            }}
            style={{ width: 'auto', fontWeight: 600, padding: '8px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer' }}
          >
            {[...Array(12)].map((_, i) => {
              const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
              const val = `${d.getFullYear()}-${d.getMonth() + 1}`;
              const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      {/* A — Monthly Overview */}
      <div className="overview-row">
        {[
          { label: 'Total Spending',  value: fmt(currentMonth.expense), color: 'var(--red)',    sub: 'this month' },
          { label: 'Total Income',    value: fmt(currentMonth.income),  color: 'var(--green)',  sub: 'this month' },
          { label: savings >= 0 ? 'Saved' : 'Overspent', value: fmt(Math.abs(savings)), color: savings >= 0 ? 'var(--accent)' : 'var(--red)', sub: savings >= 0 ? 'great work!' : 'exceeded income' },
        ].map(s => (
          <div className="overview-stat" key={s.label}>
            <div className="overview-stat-label">{s.label}</div>
            <div className="overview-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="overview-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Budget gauge */}
      {budget > 0 && (
        <div className="budget-gauge">
          <div className="gauge-label">
            <span className="gauge-title">Monthly Budget Usage</span>
            <span className="gauge-pct" style={{ color: gaugeColor }}>{budgetUsedPct}%</span>
          </div>
          <div className="gauge-bar">
            <div className="gauge-fill" style={{ width: `${budgetUsedPct}%`, background: gaugeColor }} />
          </div>
          <div className="gauge-info">
            <span>Spent: {fmt(currentMonth.expense)}</span>
            <span>Budget: {fmt(budget)}</span>
            <span style={{ color: savings >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {savings >= 0 ? `₹${(budget - currentMonth.expense).toLocaleString('en-IN')} left` : 'Over budget!'}
            </span>
          </div>
        </div>
      )}

      {/* Spending Forecast */}
      {regression?.slope !== undefined && (
        <div className="card" style={{ marginTop: 24, marginBottom: 24, padding: '24px 32px', borderLeft: '5px solid var(--accent)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 24, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-head)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📊 Spending Forecast</span>
            <span style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: 'var(--r-full)', background: regression.slope > 50 ? 'var(--red-soft)' : regression.slope < -50 ? 'var(--green-soft)' : 'var(--amber-soft)', color: regression.slope > 50 ? 'var(--red)' : regression.slope < -50 ? 'var(--green)' : 'var(--amber)' }}>
              {regression.slope > 50 ? '📈 Increasing' : regression.slope < -50 ? '📉 Decreasing' : '➡️ Stable'}
            </span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) 2.5fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 6 }}>Predicted Next Month</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text-1)' }}>
                {fmt(regression?.predictions?.[0]?.predicted)}
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 32 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--accent)' }}>•</span> 
                <span>{regression.slope > 50 ? 'Your average monthly spending is actively increasing.' : regression.slope < -50 ? 'Great job! Your spending trend is going down.' : 'Your spending is currently stable.'}</span>
              </div>
              {statistics?.stdDev !== undefined && statistics?.mean > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>•</span> 
                  <span>{(statistics.stdDev / statistics.mean) < 0.15 ? 'Your spending is highly consistent month-to-month.' : (statistics.stdDev / statistics.mean) > 0.35 ? 'Your expenses fluctuate heavily, making them harder to predict.' : 'Your spending has moderate fluctuations month-to-month.'}</span>
                </div>
              )}
              {budget > 0 && regression?.predictions?.[0]?.predicted > budget && (
                <div style={{ display: 'flex', gap: 8, color: 'var(--red)', fontWeight: 500 }}>
                  <span>•</span> 
                  <span>Warning: Next month's projection suggests you will exceed your monthly budget of {fmt(budget)}.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Export */}
      <ExportPanel transactions={txs} analyticsData={{ overview, currentMonth, categoryBreakdown }} user={user} />
      <div className="card span-full" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Long-Term Spending Trends & Forecast</span>
        </div>
        {trendData.length > 0 ? (
          <div style={{ height: 280 }}>
            <Line 
              data={forecastLineData} 
              options={{...lineOpts, maintainAspectRatio: false, plugins: { ...lineOpts.plugins, legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, color: 'var(--text-2)' } }}}} 
            />
          </div>
        ) : (
          <div className="empty-state"><p>Add more data over time to see trends and forecasts.</p></div>
        )}
      </div>

      {/* B & C — Charts row */}
      <div className="analytics-grid" style={{ marginBottom: 20 }}>

        {/* B — Donut chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Spending by Category</span>
            {categoryBreakdown[0] && (
              <span style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>
                Top: <strong style={{ color: 'var(--text-1)' }}>{categoryBreakdown[0]._id}</strong>
              </span>
            )}
          </div>
          {categoryBreakdown.length > 0 ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 160, height: 160, flex: '0 0 160px' }}>
                <Doughnut data={donutData} options={donutOpts} />
              </div>
              <div className="cat-legend" style={{ flex: 1, minWidth: 140 }}>
                {categoryBreakdown.slice(0, 6).map((c, i) => {
                  const pct = totalCatSpend > 0 ? Math.round((c.total / totalCatSpend) * 100) : 0;
                  return (
                    <div className="cat-legend-row" key={c._id}>
                      <div className="cat-dot" style={{ background: CAT_COLORS[i] }} />
                      <span className="cat-legend-label">{CAT_ICONS[c._id] || '📦'} {c._id.split(' ')[0]}</span>
                      <div className="cat-legend-bar"><div className="cat-legend-fill" style={{ width: `${pct}%`, background: CAT_COLORS[i] }} /></div>
                      <span className="cat-legend-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state"><p>No expense data this month</p></div>
          )}
        </div>

        {/* C — Line chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Daily Spending — {monthName}</span>
            {avgSpend > 0 && (
              <span style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>
                avg/day: <strong style={{ color: 'var(--text-1)' }}>{fmt(Math.round(avgSpend))}</strong>
              </span>
            )}
          </div>
          {dailySpending.length > 0 ? (
            <Line data={lineData} options={lineOpts} />
          ) : (
            <div className="empty-state"><p>No daily data yet</p></div>
          )}
        </div>

        {/* D — Insights */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">💡 Key Insights</span>
          </div>
          {insights.length > 0 ? (
            <div className="insight-list">
              {insights.slice(0, 4).map((ins, i) => (
                <div className="insight-item" key={i}>
                  <div className={`insight-icon ${ins.type}`}>{ins.icon}</div>
                  <div className="insight-text">{ins.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>Add more transactions to get insights</p></div>
          )}
        </div>

        {/* E — Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <span style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>last 5</span>
          </div>
          {recentTxs.length > 0 ? (
            <div>
              {recentTxs.map(tx => {
                const color = CAT_COLORS[Object.keys(CAT_ICONS).indexOf(tx.category) % CAT_COLORS.length] || '#6b7280';
                return (
                  <div className="activity-row" key={tx._id}>
                    <div className="activity-icon" style={{ background: color + '18' }}>
                      <span style={{ fontSize: '1rem' }}>{CAT_ICONS[tx.category] || '📦'}</span>
                    </div>
                    <div className="activity-info">
                      <div className="activity-name">{tx.description || tx.category}</div>
                      <div className="activity-date">{fmtDate(tx.date)} · {tx.category.split(' ')[0]}</div>
                    </div>
                    <div className="activity-amount" style={{ color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><p>No transactions yet</p></div>
          )}
        </div>

      </div>
    </div>
  );
}
