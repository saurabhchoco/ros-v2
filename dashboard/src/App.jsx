import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from './config/firebase';
import { apiService } from './services/api';
import './App.css';
import OrdersList from './pages/OrdersList';
import KDSScreen from './pages/KDSScreen';
import Reports from './pages/Reports';
import Captain from './pages/Captain';

export default function App() {

  const [currentPage, setCurrentPage] =
    useState('kds');
  const [user, setUser] =
    useState(null);
  const [outlet, setOutlet] =
    useState(null);
  const [authLoading, setAuthLoading] =
    useState(true);
  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [loginError, setLoginError] =
    useState('');
  const [loginLoading, setLoginLoading] =
    useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const res =
              await apiService.getMe();
            const data = res.data;
            if (data.success) {
              setOutlet({
                organizationId:
                  data.data.organizationId,
                outletId:
                  data.data.outletId,
                outletName:
                  data.data.fullName ||
                  'My Outlet'
              });
            }
          } catch (err) {
            console.error(
              'Failed to load user context',
              err
            );
          }
        } else {
          setUser(null);
          setOutlet(null);
        }
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (err) {
      setLoginError(
        'Invalid email or password'
      );
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="loading">
        Loading R-OS...
      </div>
    );
  }

  if (!user || !outlet) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h2>R-OS</h2>
          <p>Restaurant Operating System</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              required
            />
            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? 'Signing in...'
                : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>R-OS</h1>
        <div className="nav-buttons">
          <button
            className={
              currentPage === 'kds'
                ? 'active' : ''
            }
            onClick={() =>
              setCurrentPage('kds')
            }
          >
            KDS Board
          </button>
          <button
            className={
              currentPage === 'orders'
                ? 'active' : ''
            }
            onClick={() =>
              setCurrentPage('orders')
            }
          >
            Orders
          </button>
          <button
            className={
              currentPage === 'reports'
                ? 'active' : ''
            }
            onClick={() =>
              setCurrentPage('reports')
            }
          >
            Reports
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

          <button
            className={
              currentPage === 'captain'
                ? 'active' : ''
            }
            onClick={() =>
              setCurrentPage('captain')
            }
          >
            Captain
          </button>
        </div>
      </nav>

      <main className="page-container">
        {currentPage === 'kds' && (
          <KDSScreen outlet={outlet} />
        )}
        {currentPage === 'orders' && (
          <OrdersList outlet={outlet} />
        )}
        {currentPage === 'reports' && (
          <Reports outlet={outlet} />
        )}
        {currentPage === 'captain' && (
          <Captain outlet={outlet} />
        )}
      </main>
    </div>
  );
}