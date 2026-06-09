// dashboard/src/pages/owner/OutletStaff.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { 
  UserCircleIcon, 
  ArrowPathIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import TeamEmptyState from '../../components/team/TeamEmptyState';

export default function OutletStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);
  const [staff, setStaff] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const drawerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!outletId) return;
    fetchStaff();
    fetchKPIs();
  }, [outletId]);

  useEffect(() => {
    const handleScroll = () => {
      if (drawerRef.current) {
        setIsScrolled(drawerRef.current.scrollTop > 0);
      }
    };
    const drawer = drawerRef.current;
    if (drawer) drawer.addEventListener('scroll', handleScroll);
    return () => drawer?.removeEventListener('scroll', handleScroll);
  }, [drawerOpen]);

  const fetchStaff = async () => {
    try {
      const res = await apiService.getOutletStaff(outletId);
      setStaff(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const res = await apiService.getOutletStaffKPIs(outletId);
      setKpis(res.data.data);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return { text: 'Never active', dot: 'bg-gray-300' };
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return { text: 'Just now', dot: 'bg-green-500' };
    if (diff < 60) return { text: `${diff} min ago`, dot: 'bg-green-500' };
    return { text: `${Math.floor(diff / 60)}h ago`, dot: 'bg-green-500' };
  };

  const getShiftStatus = (shiftStatus, shiftStartedAt) => {
    if (shiftStatus === 'ACTIVE') {
      const diffMs = Date.now() - new Date(shiftStartedAt).getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (3600000)) / 60000);
      return { 
        text: `ON SHIFT • ${hours}h ${minutes}m`, 
        bg: 'bg-green-50 text-green-700 border-green-200', 
        dot: 'bg-green-500' 
      };
    }
    if (shiftStatus === 'HANDED_OVER') return { 
      text: 'HANDOVER PENDING', 
      bg: 'bg-purple-50 text-purple-700 border-purple-200', 
      dot: 'bg-purple-500' 
    };
    if (shiftStatus === 'FORCE_CLOSED') return { 
      text: 'FORCE CLOSED', 
      bg: 'bg-red-50 text-red-700 border-red-200', 
      dot: 'bg-red-500' 
    };
    return { 
      text: 'OFF SHIFT', 
      bg: 'bg-gray-50 text-gray-500 border-gray-200', 
      dot: 'bg-gray-400' 
    };
  };

  const roleRingColors = {
    CAPTAIN: 'ring-2 ring-blue-400 ring-offset-2',
    CASHIER: 'ring-2 ring-purple-400 ring-offset-2',
    KITCHEN: 'ring-2 ring-orange-400 ring-offset-2',
    ARM: 'ring-2 ring-teal-400 ring-offset-2',
    GSA: 'ring-2 ring-indigo-400 ring-offset-2',
    OUTLET_MANAGER: 'ring-2 ring-emerald-400 ring-offset-2',
    default: 'ring-2 ring-gray-200'
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading staff...</div>;
  }

  return (
    <div className="bg-[#F5F7FB] min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <button
              onClick={() => navigate('/owner')}
              className="text-indigo-500 text-sm font-medium hover:underline mb-2 inline-block"
            >
              ← Back to Outlets
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              Staff – {outlet?.outletName || outlet?.name || 'Outlet'}
            </h2>
          </div>
          <button
            onClick={() => navigate(`/owner/managers/create?org=${outlet?.organization_id}&outlet=${outletId}`)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600"
          >
            + Add Staff
          </button>
        </div>

        {/* KPI Strip */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">👥</div>
              <div>
                <div className="text-2xl font-bold">{kpis.total_staff || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Staff</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-lg">🟢</div>
              <div>
                <div className="text-2xl font-bold text-green-600">{kpis.on_shift || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">On Shift</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-lg">🔄</div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{kpis.handover_today || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Handovers Today</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg">⏱</div>
              <div>
                <div className="text-2xl font-bold">{Number(kpis.avg_closure_minutes || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Closure (min)</div>
              </div>
            </div>
          </div>
        )}

        {/* Conditional rendering: Empty State or Staff Grid */}
        {staff.length === 0 ? (
          <TeamEmptyState outletId={outletId} organizationId={outlet?.organization_id} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staff.map((member) => {
              const shift = getShiftStatus(member.shift_status, member.shift_started_at);
              const ringColor = roleRingColors[member.role] || roleRingColors.default;
              const lastActive = formatLastActive(member.last_active_at);
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    setSelectedStaff(member);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full ${ringColor}`}>
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{member.full_name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {member.role}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${shift.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${shift.dot}`}></span>
                              {shift.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
                        <Menu.Button className="p-1 rounded-full hover:bg-gray-100">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </Menu.Button>
                        <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-1"
                          leave="transition duration-75 ease-in"
                          leaveFrom="transform scale-100 opacity-1"
                          leaveTo="transform scale-95 opacity-0"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                            <Menu.Item>
                              {({ active }) => (
                                <button className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}>
                                  View Details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}>
                                  Shift History
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}>
                                  Performance
                                </button>
                              )}
                            </Menu.Item>
                            <div className="border-t border-gray-100 my-1"></div>
                            <Menu.Item>
                              {({ active }) => (
                                <button className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-600`}>
                                  Force Logout
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-600`}>
                                  Reset PIN
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="text-xl font-bold text-gray-800">{member.orders_today}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide">Orders</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="text-xl font-bold text-gray-800">₹{member.settlements_today?.toLocaleString() || 0}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide">Settlements</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="text-xl font-bold text-gray-800">{Number(member.avg_closure_minutes).toFixed(1)}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide">Avg Closure</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${lastActive.dot}`}></span>
                          <div className="text-sm font-semibold text-gray-800">{lastActive.text}</div>
                        </div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Last Activity</div>
                      </div>
                    </div>

                    {member.last_handover && (
                      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                        <ArrowPathIcon className="h-3 w-3" />
                        <span>Handover: {member.last_handover.from_name} → {member.last_handover.to_name}</span>
                        <span className="text-gray-400">• {new Date(member.last_handover.created_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Slide Drawer – All Refinements */}
      {drawerOpen && selectedStaff && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel with scroll shadow */}
          <div
            ref={drawerRef}
            className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
              isScrolled ? 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : ''
            }`}
          >
            <div className="pt-7 pb-8">
              {(() => {
                const shift = getShiftStatus(selectedStaff.shift_status, selectedStaff.shift_started_at);
                const lastActive = formatLastActive(selectedStaff.last_active_at);
                return (
                  <>
                    {/* Header – Identity Cluster */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pb-4 z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`rounded-full ring-2 ring-indigo-200 ring-offset-2`}>
                          <UserCircleIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{selectedStaff.full_name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                              {selectedStaff.role}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${shift.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${shift.dot}`}></span>
                              {shift.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{outlet?.outletName || 'Outlet'}</span>
                            <span>•</span>
                            <span>Last active {lastActive.text}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDrawerOpen(false)}
                        className="absolute right-5 top-5 p-1 rounded-full hover:bg-gray-100"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="px-5 space-y-6">
                      {/* Today Snapshot */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Today</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <div className="text-2xl font-bold text-gray-800">{selectedStaff.orders_today}</div>
                            <div className="text-xs text-gray-500 mt-1">Orders</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <div className="text-2xl font-bold text-gray-800">₹{selectedStaff.settlements_today?.toLocaleString() || 0}</div>
                            <div className="text-xs text-gray-500 mt-1">Settlements</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <div className="text-2xl font-bold text-gray-800">{Number(selectedStaff.avg_closure_minutes).toFixed(1)}</div>
                            <div className="text-xs text-gray-500 mt-1">Avg Closure</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <div className="text-2xl font-bold text-gray-800">{selectedStaff.open_orders || 0}</div>
                            <div className="text-xs text-gray-500 mt-1">Open</div>
                          </div>
                        </div>
                      </div>

                      {/* Live Activity Feed (placeholder) */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Activity</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2 text-gray-600">
                            <span className="text-xs text-gray-400">10:42 PM</span>
                            <span className="flex-1">Accepted Order #1042</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600">
                            <span className="text-xs text-gray-400">10:31 PM</span>
                            <span className="flex-1">Handover completed (Captain → Captain 12)</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600">
                            <span className="text-xs text-gray-400">09:58 PM</span>
                            <span className="flex-1">Started shift</span>
                          </div>
                          <button className="text-indigo-500 text-xs mt-2 hover:underline">View all activity →</button>
                        </div>
                      </div>

                      {/* Shift Timeline (visual bullets) */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shift Timeline</h4>
                        <div className="space-y-3 text-sm">
                          {selectedStaff.shift_started_at && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <div>
                                <div className="font-medium text-gray-800">Shift started</div>
                                <div className="text-xs text-gray-500">{new Date(selectedStaff.shift_started_at).toLocaleString()}</div>
                              </div>
                            </div>
                          )}
                          {selectedStaff.last_handover && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                              <div>
                                <div className="font-medium text-gray-800">Last handover</div>
                                <div className="text-xs text-gray-500">{selectedStaff.last_handover.from_name} → {selectedStaff.last_handover.to_name}</div>
                                <div className="text-xs text-gray-400">{new Date(selectedStaff.last_handover.created_at).toLocaleString()}</div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                            <div>
                              <div className="font-medium text-gray-800">Last active</div>
                              <div className="text-xs text-gray-500">{lastActive.text}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions – Primary / Secondary / Danger */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</h4>
                        {/* Primary */}
                        <div className="space-y-2 mb-3">
                          <button className="w-full text-left px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-medium transition-all hover:translate-x-0.5">
                            📋 Shift History
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-medium transition-all hover:translate-x-0.5">
                            📊 Performance
                          </button>
                        </div>
                        {/* Secondary */}
                        <div className="space-y-2 mb-3">
                          <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-all hover:translate-x-0.5">
                            🔑 Reset PIN
                          </button>
                        </div>
                        {/* Danger zone */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <button className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-all hover:translate-x-0.5">
                            🚪 Force Logout
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm bg-red-50/50 hover:bg-red-100 rounded-lg text-red-500 transition-all hover:translate-x-0.5">
                            ⛔ Deactivate User
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}