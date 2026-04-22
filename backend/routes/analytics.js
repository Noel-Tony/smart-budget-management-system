const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// Statistical helper functions
const calculateStats = (values) => {
  if (!values || values.length === 0) return { mean: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { mean: +mean.toFixed(2), variance: +variance.toFixed(2), stdDev: +stdDev.toFixed(2), min, max, n };
};

// Linear regression
const linearRegression = (dataPoints) => {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, intercept: 0, predictions: [], rSquared: 0 };

  const sumX = dataPoints.reduce((s, p) => s + p.x, 0);
  const sumY = dataPoints.reduce((s, p) => s + p.y, 0);
  const sumXY = dataPoints.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = dataPoints.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  const ssTot = dataPoints.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
  const ssRes = dataPoints.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return {
    slope: +slope.toFixed(2),
    intercept: +intercept.toFixed(2),
    rSquared: +rSquared.toFixed(4)
  };
};

// @GET /api/analytics/overview - Full analytics
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const currentMonth = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;

    // All-time totals
    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalIncome = totals.find(t => t._id === 'income')?.total || 0;
    const totalExpense = totals.find(t => t._id === 'expense')?.total || 0;
    const balance = totalIncome - totalExpense;

    // Current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const monthTotals = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const monthIncome = monthTotals.find(t => t._id === 'income')?.total || 0;
    const monthExpense = monthTotals.find(t => t._id === 'expense')?.total || 0;

    // Category breakdown (current month expenses)
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trend (last 12 months from selected month)
    const twelveMonthsAgo = new Date(currentYear, currentMonth - 1, 1);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly trend
    const trendMap = {};
    monthlyTrend.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expense: 0 };
      trendMap[key][item._id.type] = item.total;
    });
    const trendData = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

    // Statistics on monthly expenses
    const expenseValues = trendData.map(t => t.expense);
    const stats = calculateStats(expenseValues);

    // Linear regression on monthly expenses
    const regressionPoints = expenseValues.map((val, idx) => ({ x: idx + 1, y: val }));
    const regression = linearRegression(regressionPoints);

    // Predict next 3 months
    const predictions = [];
    const lastX = regressionPoints.length;
    for (let i = 1; i <= 3; i++) {
      const predictedX = lastX + i;
      const predictedY = Math.max(0, regression.slope * predictedX + regression.intercept);
      const futureDate = new Date(currentYear, currentMonth - 1, 1);
      futureDate.setMonth(futureDate.getMonth() + i);
      predictions.push({
        month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
        predicted: +predictedY.toFixed(2)
      });
    }

    // Category-wise statistics
    const allExpenses = await Transaction.find({ user: userId, type: 'expense' });
    const categoryStats = {};
    allExpenses.forEach(t => {
      if (!categoryStats[t.category]) categoryStats[t.category] = [];
      categoryStats[t.category].push(t.amount);
    });
    const categoryStatsSummary = Object.entries(categoryStats).map(([cat, vals]) => ({
      category: cat,
      ...calculateStats(vals)
    }));

    // Daily spending this month
    const dailySpending = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      overview: { totalIncome, totalExpense, balance },
      currentMonth: { income: monthIncome, expense: monthExpense, balance: monthIncome - monthExpense },
      categoryBreakdown,
      trendData,
      statistics: stats,
      regression: { ...regression, predictions },
      categoryStatsSummary,
      dailySpending
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/analytics/category-stats - Category-wise stats
router.get('/category-stats', protect, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.user._id, type: 'expense' };
    if (category) filter.category = category;

    const transactions = await Transaction.find(filter).sort({ date: 1 });
    const values = transactions.map(t => t.amount);
    const stats = calculateStats(values);

    const regressionPoints = transactions.map((t, idx) => ({ x: idx + 1, y: t.amount }));
    const regression = linearRegression(regressionPoints);

    res.json({ success: true, stats, regression, count: values.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
