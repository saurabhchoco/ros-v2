// dashboard/src/components/MenuHealth.jsx
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Skeleton from './ui/Skeleton';
import toast from 'react-hot-toast';

export default function MenuHealth({ outletId, compact = false }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outletId) return;
    const fetchHealth = async () => {
      try {
        const res = await apiService.getMenuHealth(outletId);
        setHealthData(res.data.data);
      } catch (err) {
        console.error('Failed to load menu health', err);
        toast.error('Could not load menu health');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [outletId]);

  if (loading) {
    if (compact) {
      return (
        <div className="bg-white rounded-xl border p-3">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-10 w-20 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  const {
    total_items = 0,
    with_category = 0,
    with_price = 0,
    active_items = 0,
    hidden_items = 0,
    draft_items = 0,
    out_of_stock_items = 0,
    missing_description = 0,
    health_score = 0
  } = healthData;

  const healthScore = health_score;
  const totalItems = total_items;
  const missingDesc = missing_description;
  const hiddenItems = hidden_items;
  const outOfStock = out_of_stock_items; // assuming draft means not active? Or use status counts. But keep simple.

  if (compact) {
    return (
      <div className="bg-white rounded-xl border p-3 shadow-sm">
        <div className="text-sm font-semibold text-gray-700 mb-2">Menu Health</div>
        <div className="text-2xl font-bold text-indigo-600">{healthScore}%</div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div>{totalItems} Items</div>
          <div className="text-yellow-600">{missingDesc} Missing Desc</div>
          <div className="text-gray-500">{hiddenItems} Hidden</div>
          <div className="text-red-500">{outOfStock} Out of stock</div>
        </div>
      </div>
    );
  }

  // Full-size version (original design)
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Menu Health</h3>
        <span className="text-2xl font-bold text-indigo-600">{healthScore}%</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total items</span>
          <span className="font-medium">{totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">With category</span>
          <span className="font-medium">{with_category} / {totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">With price</span>
          <span className="font-medium">{with_price} / {totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Active items</span>
          <span className="font-medium text-green-600">{active_items}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hidden</span>
          <span className="font-medium text-gray-500">{hidden_items}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Missing description</span>
          <span className="font-medium text-yellow-600">{missing_description}</span>
        </div>
      </div>
    </div>
  );
}