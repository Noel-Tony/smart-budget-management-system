const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @GET /api/transactions - Get all transactions
router.get('/', protect, async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/transactions - Create transaction
router.post('/', protect, async (req, res) => {
  try {
    const { type, amount, category, description, date, tags, isRecurring } = req.body;
    const transaction = await Transaction.create({
      user: req.user._id,
      type, amount, category, description,
      date: date || new Date(),
      tags, isRecurring
    });
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/transactions/:id - Get single transaction
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/transactions/:id - Update transaction
router.put('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/transactions/summary/monthly - Monthly summary
router.get('/summary/monthly', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const summary = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryBreakdown = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, summary, categoryBreakdown, month: Number(month), year: Number(year) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
