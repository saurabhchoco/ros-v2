import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.users.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = roleFilter
    ? users.filter(u => u.role === roleFilter)
    : users;

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }
    try {
      await adminApi.users.deactivate(userId);
      loadUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>

      <div className="mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="BRAND_OWNER">Brand Owner</option>
          <option value="OUTLET_MANAGER">Outlet Manager</option>
          <option value="CAPTAIN">Captain</option>
          <option value="KITCHEN">Kitchen</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center text-gray-500">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Role</th>
                <th className="border p-3 text-left">Organization</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-3">{user.full_name}</td>
                  <td className="border p-3">{user.email}</td>
                  <td className="border p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {user.role}
                    </span>
                  </td>
                  <td className="border p-3">{user.organization_name || '-'}</td>
                  <td className="border p-3">
                    <span
                      className={`px-2 py-1 rounded ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    <button
                      onClick={() => handleDeactivate(user.id)}
                      disabled={user.status !== 'ACTIVE'}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}