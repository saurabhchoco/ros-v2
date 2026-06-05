import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function MenuHealth({ outletId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outletId) return;
    const fetchHealth = async () => {
      try {
        const res = await apiService.getMenuHealth(outletId);
        setHealth(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [outletId]);

  if (loading) return <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-32"></div>;
  if (!health) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Menu Health</h3>
        <div className={`text-2xl font-bold ${getScoreColor(health.health_score)}`}>
          {health.health_score}%
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>✓ Categories assigned</span>
          <span>{health.with_category} / {health.total_items}</span>
        </div>
        <div className="flex justify-between">
          <span>✓ Prices set</span>
          <span>{health.with_price} / {health.total_items}</span>
        </div>
        <div className="flex justify-between">
          <span>✓ Active items</span>
          <span>{health.active_items} / {health.total_items}</span>
        </div>
        {health.hidden_items > 0 && (
          <div className="text-yellow-600 flex justify-between">
            <span>⚠ Hidden items</span>
            <span>{health.hidden_items}</span>
          </div>
        )}
        {health.draft_items > 0 && (
          <div className="text-yellow-600 flex justify-between">
            <span>⚠ Draft items</span>
            <span>{health.draft_items}</span>
          </div>
        )}
        {health.missing_description > 0 && (
          <div className="text-gray-500 flex justify-between">
            <span>Missing description</span>
            <span>{health.missing_description}</span>
          </div>
        )}
      </div>
    </div>
  );
}