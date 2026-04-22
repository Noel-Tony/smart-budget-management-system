const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, monthlyBudget } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, monthlyBudget: monthlyBudget || 0 });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      monthlyBudget: req.user.monthlyBudget,
      currency: req.user.currency
    }
  });
});

// @PUT /api/auth/update
router.put('/update', protect, async (req, res) => {
  try {
    const { name, monthlyBudget, currency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, monthlyBudget, currency },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
