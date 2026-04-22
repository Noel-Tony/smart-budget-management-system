import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  MdDashboard, MdSwapHoriz, MdBarChart, MdAccountBalanceWallet,
  MdPerson, MdLogout, MdMenu, MdClose, MdDarkMode, MdLightMode, MdAdd
} from 'react-icons/md';
import toast from 'react-hot-toast';
import QuickAdd from './QuickAdd';

const navItems = [
  { path: '/dashboard',    icon: <MdDashboard />,            label: 'Dashboard' },
  { path: '/transactions', icon: <MdSwapHoriz />,            label: 'Transactions' },
  { path: '/analytics',    icon: <MdBarChart />,             label: 'Analytics' },
  { path: '/budget',       icon: <MdAccountBalanceWallet />, label: 'Budget' },
  { path: '/profile',      icon: <MdPerson />,               label: 'Profile' },
];

export default function Layout() {
  const { user, logout }    = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate              = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleQuickSuccess = () => {
    toast.success('Transaction added! 🎉');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>Smart Budget</h1>
          <span>Management System</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-label">
              {dark ? <MdDarkMode style={{ fontSize: '1rem' }} /> : <MdLightMode style={{ fontSize: '1rem' }} />}
              {dark ? 'Dark Mode' : 'Light Mode'}
            </span>
            <div className={`toggle-pill ${dark ? 'on' : ''}`} />
          </button>

          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>

          <button className="nav-item" onClick={handleLogout} style={{ color: '#f87171', width: '100%' }}>
            <MdLogout /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        className="btn-icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: 'fixed', top: 14, left: 14, zIndex: 200, display: 'none' }}
        id="mob-menu"
      >
        {sidebarOpen ? <MdClose /> : <MdMenu />}
      </button>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* FAB — Own Entry */}
      <button className="fab" onClick={() => setShowQuickAdd(true)} title="Add expense">
        <MdAdd />
      </button>
      <div className="fab-label">Own Entry</div>

      {/* QuickAdd Modal */}
      {showQuickAdd && (
        <QuickAdd
          onClose={() => setShowQuickAdd(false)}
          onSuccess={handleQuickSuccess}
        />
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}
    </div>
  );
}
