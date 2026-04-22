const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// @GET /api/budget - Get budget for month
router.get('/', protect, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const budget = await Budget.findOne({ user: req.user._id, month: Number(month), year: Number(year) });
    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/budget - Create or update budget
router.post('/', protect, async (req, res) => {
  try {
    const { month, year, totalBudget, categoryLimits } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month, year },
      { totalBudget, categoryLimits },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, budget });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/budget/all - Get all budgets
router.get('/all', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, budgets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
