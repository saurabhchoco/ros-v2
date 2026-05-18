import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    brands: 0,
    outlets: 0,
    users: 0
  });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [brandsRes, outletsRes, usersRes] =
          await Promise.all([
            adminApi.listBrands(),
            adminApi.listOutlets(),
            adminApi.listUsers()
          ]);

        const brandsData =
          brandsRes.data.data || [];
        const outletsData =
          outletsRes.data.data || [];
        const usersData =
          usersRes.data.data || [];

        setBrands(brandsData);
        setStats({
          brands: brandsData.length,
          outlets: outletsData.length,
          users: usersData.length
        });
      } catch (e) {
        console.error('Failed to load admin stats', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Platform Overview
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          All brands and outlets across R-OS
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Brands',
            value: stats.brands,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
          },
          {
            label: 'Total Outlets',
            value: stats.outlets,
            color: 'text-green-600',
            bg: 'bg-green-50'
          },
          {
            label: 'Total Users',
            value: stats.users,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          }
        ].map(stat => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-2xl p-6`}
          >
            <p className="text-gray-500 text-sm mb-1">
              {stat.label}
            </p>
            <p className={`${stat.color} font-extrabold text-4xl`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Brands list */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Brands
        </h3>
        <button
          onClick={() => navigate('/admin/brands/create')}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
        >
          + Add Brand
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Brand
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Outlets
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Users
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => (
              <tr
                key={brand.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <td className="p-4">
                  <p className="font-semibold text-gray-800">
                    {brand.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {brand.id}
                  </p>
                </td>
                <td className="p-4 text-gray-700">
                  {brand.outlet_count}
                </td>
                <td className="p-4 text-gray-700">
                  {brand.user_count}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    brand.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {brand.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/outlets?org=${brand.id}`
                      )
                    }
                    className="text-indigo-500 text-sm font-medium hover:underline mr-3"
                  >
                    Outlets
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/outlets/create?org=${brand.id}`
                      )
                    }
                    className="text-green-500 text-sm font-medium hover:underline"
                  >
                    + Outlet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}