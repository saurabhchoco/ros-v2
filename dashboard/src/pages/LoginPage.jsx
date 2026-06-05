import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  Eye,
  EyeOff,
  Loader2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setResetSent(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error('Failed to send reset email. Try again.');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex">

      {/* LEFT PANEL */}

      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 text-white px-16 py-14 flex-col justify-between">

        <div>
          <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 mb-8">
            Restaurant Operations Platform
          </div>

          <div className="mb-8">
            <h1 className="text-6xl font-bold tracking-tight">
              R-OS
            </h1>

            <p className="text-xl text-slate-300 mt-3">
              Restaurant Operations Platform
            </p>
          </div>

          <p className="mt-6 text-2xl font-medium text-slate-100 leading-relaxed">
            Run your restaurant business with complete operational control.
          </p>

          <p className="mt-5 text-slate-400 text-lg max-w-lg leading-relaxed">
            Orders, staff, inventory, analytics and outlet performance -
            all from one centralized platform.
          </p>
        </div>

        <div>

          <h3 className="text-sm uppercase tracking-wider text-slate-500 mb-6">
            Built For
          </h3>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8">

            {[
              'Restaurants',
              'Cafes',
              'Cloud Kitchens',
              'Food Courts',
              'Kiosks',
              'Street Food'
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-slate-200"
              >
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}

          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex gap-6 text-sm text-slate-400">

            <span>Real-Time Operations</span>

            <span>•</span>

            <span>Multi-Outlet Ready</span>

            <span>•</span>

            <span>Built in India 🇮🇳</span>

          </div>
        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="flex-1 flex items-center justify-center px-6">

        <div className="w-full max-w-xl">

          {/* MOBILE BRANDING */}

          <div className="lg:hidden text-center mb-8">

            <h1 className="text-4xl font-bold text-slate-900">
              R-OS
            </h1>

            <p className="mt-2 text-slate-500">
              Restaurant Operations Platform
            </p>

          </div>

          {/* LOGIN CARD */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10">

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="mt-2 text-slate-500">
                Access your restaurant dashboard and monitor operations in real time.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  placeholder="Enter your work email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-11"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>

              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </button>

              <div className="text-center">

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Forgot Password?
                </button>

                {resetSent && (
                  <div className="mt-2 text-xs text-green-600">
                    Password reset email sent
                  </div>
                )}

              </div>

            </form>

            <div className="mt-8 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
              Need access? Contact your brand administrator.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}