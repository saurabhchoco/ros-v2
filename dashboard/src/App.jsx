import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { apiService } from './services/api';
import { useAuthStore } from './store/authStore';
import { router } from './routes';

export default function App() {
  const { setUser, setOutlet, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const res = await apiService.getMe();
          if (res.data.success) {
            setOutlet(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load outlet:', err);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <RouterProvider router={router} />;
}
