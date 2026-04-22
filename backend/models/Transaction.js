const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food & Dining',
      'Travel & Transport',
      'Entertainment',
      'Education',
      'Shopping',
      'Health & Medical',
      'Utilities',
      'Rent & Housing',
      'Salary & Stipend',
      'Part-time Job',
      'Scholarship',
      'Family Support',
      'Other Income',
      'Other Expense'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
