# Smart Budget Management System

A full-stack MERN application for student financial management with statistical analysis, charts, and linear regression forecasting.

---

## Tech Stack

- **MongoDB** — Database
- **Express.js** — Backend REST API
- **React.js** — Frontend UI
- **Node.js** — Server runtime

---

## Features

- ✅ User authentication (JWT)
- ✅ Add / Edit / Delete transactions (income & expense)
- ✅ 14 spending categories (Food, Travel, Entertainment, Education, etc.)
- ✅ Dashboard with real-time stats
- ✅ Category-wise budget limits with progress tracking
- ✅ Charts: Doughnut, Bar, Line
- ✅ Statistical Analysis: Mean, Variance, Standard Deviation per category
- ✅ Linear Regression for spending trend & 3-month forecast
- ✅ Dynamic Monthly Filtering (Time travel through historical analytics)
- ✅ Human-readable statistical insights & budget warnings
- ✅ Responsive Dark/Light professional UI with refined typography

---

## Project Structure

```
budget-app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budget.js
│   │   └── analytics.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── Transactions.js
    │   │   ├── Analytics.js
    │   │   ├── Budget.js
    │   │   └── Profile.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## Prerequisites

- Node.js v16+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- npm or yarn

---

## Setup Instructions

### 1. Clone / Extract the project

```bash
unzip budget-app.zip
cd budget-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/student_budget
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

> For MongoDB Atlas, replace `MONGO_URI` with your connection string, e.g.:
> `mongodb+srv://<user>:<password>@cluster.mongodb.net/student_budget`

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions |
| POST | `/api/transactions` | Add transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary/monthly` | Monthly summary |

### Budget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget` | Get budget for month |
| POST | `/api/budget` | Create/update budget |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Full analytics with stats & regression |
| GET | `/api/analytics/category-stats` | Per-category statistics |

---

## Analytics & Statistics

The system applies the following statistical techniques:

- **Mean** — Average spending per category and monthly
- **Variance** — Spread of spending values
- **Standard Deviation** — Measures spending inconsistency
- **Linear Regression** — `y = mx + b` trend line over monthly data
- **R² Score** — Regression fit quality
- **Forecasting** — Predicts next 3 months of spending

---

## Default Categories

**Expenses:** Food & Dining, Travel & Transport, Entertainment, Education, Shopping, Health & Medical, Utilities, Rent & Housing, Other Expense

**Income:** Salary & Stipend, Part-time Job, Scholarship, Family Support, Other Income

---

## License

MIT — Free for academic and personal use.
