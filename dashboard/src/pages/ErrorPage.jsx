import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Oops!</h1>
        <p className="text-gray-600 mb-4">
          {error?.statusText || 'An unexpected error occurred'}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {error?.data || error?.message}
        </p>
        <a
          href="/"
          className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
