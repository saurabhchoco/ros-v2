import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';  // ✅ NEW

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setUser, setOutlet, setLoading: setAuthLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCred.user);

      const res = await apiService.getMe();
      if (res.data.success) {
        setOutlet(res.data.data);
        toast.success('Login successful!');  // ✅ TEST TOAST
        navigate('/');
      } else {
        toast.error('Failed to load outlet information');
        setUser(null);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-4xl font-bold text-center mb-2 text-gray-900">R-OS</h2>
          <p className="text-center text-gray-600 mb-8 text-sm">Restaurant Operating System</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* ✅ REPLACED BUTTON */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">Demo: Use your Firebase credentials</p>
        </div>
      </div>
    </div>
  );
}