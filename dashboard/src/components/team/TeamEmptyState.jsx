import { Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeamEmptyState({ outletId, organizationId }) {
  const navigate = useNavigate();

  const handleAddManager = () => {
    if (!outletId || !organizationId) {
      // Fallback: navigate to creation without params (or log error)
      console.warn('Missing outletId or organizationId');
      navigate('/owner/managers/create');
      return;
    }
    navigate(`/owner/managers/create?org=${organizationId}&outlet=${outletId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-indigo-50 rounded-full p-4 mb-4">
        <Users className="h-12 w-12 text-indigo-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">👥 Your Team Starts Here</h3>
      <p className="text-gray-500 max-w-md mb-6">
        Add an Outlet Manager to oversee daily operations and staff activities.
      </p>
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left w-full max-w-sm">
        <p className="text-sm font-medium text-gray-700 mb-2">Once added, you'll be able to:</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500" /> Track shifts</li>
          <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500" /> Monitor performance</li>
          <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500" /> Manage cash handovers</li>
          <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-500" /> View staff analytics</li>
        </ul>
      </div>
      <button
        onClick={handleAddManager}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
      >
        + Add Outlet Manager
      </button>
    </div>
  );
}