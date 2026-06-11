// dashboard/src/pages/NotFoundPage.jsx
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500 mt-2">Page not found</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Go Back
      </button>
    </div>
  );
}