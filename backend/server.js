const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budget',       require('./routes/budget'));
app.use('/api/analytics',    require('./routes/analytics'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Student Budget API is running' })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ─── DB + Server startup ────────────────────────────────────────────────────

async function startServer() {
  const PORT       = process.env.PORT       || 5000;
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_budgetwise_2024';
  process.env.JWT_SECRET = JWT_SECRET;   // always ensure it is set

  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    // No .env? Spin up an in-memory MongoDB instance automatically
    console.log('ℹ️  No MONGO_URI found – starting in-memory MongoDB (demo mode)…');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('✅ In-memory MongoDB ready');

      // Seed demo data after connection opens
      mongoose.connection.once('open', () => seedDemoData());
    } catch (e) {
      console.error('❌ Could not start in-memory MongoDB:', e.message);
      process.exit(1);
    }
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');

  app.listen(PORT, () =>
    console.log(`\n🚀 Server running → http://localhost:${PORT}\n`)
  );
}

// ─── Seed demo data ──────────────────────────────────────────────────────────

async function seedDemoData() {
  const User        = require('./models/User');
  const Transaction = require('./models/Transaction');
  const Budget      = require('./models/Budget');

  const existing = await User.findOne({ email: 'demo@student.com' });
  if (existing) return;

  const user = await User.create({
    name: 'Demo Student',
    email: 'demo@student.com',
    password: 'demo1234',
    monthlyBudget: 15000,
  });

  console.log('🌱 Demo account ready:');
  console.log('   Email   : demo@student.com');
  console.log('   Password: demo1234\n');

  const expCats = [
    'Food & Dining', 'Travel & Transport', 'Entertainment',
    'Education', 'Shopping', 'Health & Medical', 'Utilities',
  ];
  const incCats = ['Salary & Stipend', 'Family Support', 'Scholarship'];
  const now = new Date();
  const txData = [];

  for (let m = 2; m >= 0; m--) {
    const yr  = new Date(now.getFullYear(), now.getMonth() - m, 1).getFullYear();
    const mo  = new Date(now.getFullYear(), now.getMonth() - m, 1).getMonth();

    // 1 income
    txData.push({
      user: user._id, type: 'income',
      amount: 12000 + Math.floor(Math.random() * 5000),
      category: incCats[m % 3],
      description: 'Monthly allowance',
      date: new Date(yr, mo, 1),
    });

    // 8-12 expenses
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      txData.push({
        user: user._id, type: 'expense',
        amount: 100 + Math.floor(Math.random() * 2000),
        category: expCats[Math.floor(Math.random() * expCats.length)],
        description: 'Sample expense',
        date: new Date(yr, mo, 1 + Math.floor(Math.random() * 27)),
      });
    }
  }

  await Transaction.insertMany(txData);

  await Budget.create({
    user: user._id,
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    totalBudget: 15000,
    categoryLimits: [
      { category: 'Food & Dining',      limit: 4000 },
      { category: 'Travel & Transport', limit: 2000 },
      { category: 'Entertainment',      limit: 1500 },
      { category: 'Education',          limit: 3000 },
      { category: 'Shopping',           limit: 2000 },
    ],
  });

  console.log(`🌱 Seeded ${txData.length} demo transactions + monthly budget\n`);
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;
