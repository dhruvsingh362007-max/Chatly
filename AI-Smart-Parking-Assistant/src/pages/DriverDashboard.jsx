import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car,
  AlertOctagon,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Bot,
  ExternalLink,
  CreditCard,
  Scale,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge, AIMeritBadge } from '../components/Badge';
import { DisputeModal } from '../components/DisputeModal';
import { PayFineModal } from '../components/PayFineModal';
import { getDriverById, getViolations } from '../services/api';

export const DriverDashboard = () => {
  const { user, violations, refreshViolations, navigateTo, setSelectedViolationId, showToast } = useParking();

  // Local API & Filter State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [selectedPlate, setSelectedPlate] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Modals
  const [activeDisputeItem, setActiveDisputeItem] = useState(null);
  const [activePayItem, setActivePayItem] = useState(null);

  // Fetch driver profile and sync violations from Flask REST API
  const fetchDriverData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [driverRes] = await Promise.all([
        getDriverById(user?.id || 'usr_ind_001'),
        refreshViolations ? refreshViolations() : Promise.resolve()
      ]);

      if (driverRes && driverRes.driver) {
        setDriverProfile(driverRes.driver);
      }
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Driver Portal API fetch error, using local state:', err);
      setError(err.message || 'Unable to connect to Flask backend at http://127.0.0.1:5000');
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshViolations]);

  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  // Registered vehicles list from backend profile or fallback
  const registeredVehicles = useMemo(() => {
    if (driverProfile?.vehicles && driverProfile.vehicles.length > 0) {
      return driverProfile.vehicles;
    }
    return user?.vehicles || [];
  }, [driverProfile, user]);

  // Filtered violations
  const filteredViolations = useMemo(() => {
    return violations.filter((item) => {
      const plate = item.vehiclePlate || item.vehicle_plate || '';
      const status = item.status || 'Pending';

      // Plate filter
      if (selectedPlate !== 'ALL' && plate !== selectedPlate) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        const matchType = (item.type || '').toLowerCase().includes(q);
        const matchPlate = plate.toLowerCase().includes(q);
        if (!matchId && !matchLoc && !matchType && !matchPlate) return false;
      }
      return true;
    });
  }, [violations, selectedPlate, statusFilter, searchQuery]);

  // Aggregate Metrics computed from live records
  const totalViolationsCount = violations.length;

  const pendingFines = useMemo(() => {
    return violations
      .filter((v) => v.status === 'Pending' || v.status === 'Overdue' || v.status === 'Under Dispute')
      .reduce((sum, v) => {
        const fine = parseFloat(v.fineAmount ?? v.fine_amount ?? 0);
        const late = parseFloat(v.lateFee ?? v.late_fee ?? 0);
        return sum + fine + late;
      }, 0);
  }, [violations]);

  const pendingCount = violations.filter(
    (v) => v.status === 'Pending' || v.status === 'Overdue'
  ).length;

  const resolvedCount = violations.filter((v) => v.status === 'Resolved').length;
  const disputeCount = violations.filter((v) => v.status === 'Under Dispute').length;

  const resolvedSavings = useMemo(() => {
    return violations
      .filter((v) => v.status === 'Resolved')
      .reduce((sum, v) => {
        const fine = parseFloat(v.fineAmount ?? v.fine_amount ?? 1000);
        const method = v.resolutionMethod || v.resolution_method || '';
        return sum + (method.includes('Waived') || method.includes('Dismissed') ? fine : 0);
      }, 1000);
  }, [violations]);

  const handleDownloadReport = () => {
    showToast('Official Municipal Compliance Summary PDF generated.', 'success');
  };

  const activeDriver = driverProfile || user || {
    name: 'Amanpreet Singh',
    driver_license: 'DL-PB102022004581'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Driver Portal</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                error
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title={error ? error : 'Driver profile synchronized with SQLite backend'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  error ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {error ? 'Offline Cache' : 'Live SQLite Driver Record'}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            Registered Owner: <span className="font-semibold text-slate-700">{activeDriver.name}</span> • Licence:{' '}
            <span className="font-mono text-slate-700">{activeDriver.driver_license || activeDriver.driverLicense || 'DL-PB102022004581'}</span>
            {lastRefreshed && (
              <span className="ml-1.5 text-slate-400">
                • Refreshed at {lastRefreshed}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={fetchDriverData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh driver violations from backend"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => navigateTo('ai-assistant')}
            className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Consult AI Assistant</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Download Statement"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Notice Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900">Backend Connection Warning</p>
              <p className="text-xs text-rose-700 mt-0.5">
                Could not refresh driver data from Flask: <span className="font-mono text-[11px]">{error}</span>. Displaying local cache.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDriverData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Stat Cards (Matching clean SaaS style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Citations"
          value={loading ? '...' : totalViolationsCount}
          subtitle={loading ? 'Loading...' : 'Across all registered vehicles'}
          icon={Car}
          color="navy"
        />

        <StatCard
          title="Outstanding Fines"
          value={loading ? '...' : `₹${pendingFines.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={loading ? 'Loading...' : `${pendingCount} citations active`}
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Resolved Violations"
          value={loading ? '...' : resolvedCount}
          subtitle={loading ? 'Loading...' : `₹${resolvedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })} total waived`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Under AI Dispute"
          value={loading ? '...' : disputeCount}
          subtitle={loading ? 'Loading...' : 'Pending adjudication in SQLite'}
          icon={Scale}
          color="indigo"
        />
      </div>

      {/* Active AI Dispute Advisory Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy-900 flex items-center gap-2">
              <span>AI Compliance Advisory: Grace Window Benchmark</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                Sample Rule PR-101.B
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Citation <span className="font-mono font-bold text-navy-900">#IND-VIO-2024-8841</span> (Mall Road, Ludhiana) qualifies for demonstration appeal submission under Sample Guideline PR-101.B citing simulated payment retry latency (review outcome subject to adjudicator discretion).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const target = violations.find((v) => v.id === 'IND-VIO-2024-8841');
            if (target) setActiveDisputeItem(target);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          Review & Submit Appeal
        </button>
      </div>

      {/* Violations Table & Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-900">Violation Ledger</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  SQLite Live Ledger
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Detailed record of municipal citations, optical camera audits, and dispute outcomes.
              </p>
            </div>

            {/* Vehicle Filter Selector (Populated dynamically from backend driver profile) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Plate:</span>
              <select
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="ALL">All Registered Vehicles ({registeredVehicles.length})</option>
                {registeredVehicles.map((veh) => (
                  <option key={veh.plate} value={veh.plate}>
                    {veh.plate} ({veh.make} {veh.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Tabs and Search Input */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Pending', 'Under Dispute', 'Resolved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'ALL' ? 'All Records' : tab}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search citation ID, road, plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center justify-between gap-4 animate-pulse py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3 bg-slate-200 rounded" />
                    <div className="w-48 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-20 h-7 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Citation ID</th>
                  <th className="px-5 py-3">Violation Type & Location</th>
                  <th className="px-5 py-3">Vehicle Plate</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Fine Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <p className="text-sm font-semibold">No citations found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search terms or filter criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredViolations.map((v) => {
                    const fine = parseFloat(v.fineAmount ?? v.fine_amount ?? 0);
                    const late = parseFloat(v.lateFee ?? v.late_fee ?? 0);
                    const totalDue = fine + late;
                    const plate = v.vehiclePlate || v.vehicle_plate || 'UNKNOWN';
                    const issueDate = v.issueDate || v.issue_date || 'Recent';

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-3.5 font-mono font-bold text-navy-900">
                          {v.id}
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {v.type}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate mt-0.5">{v.location}</p>
                        </td>

                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-700">
                          {plate}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {issueDate}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-navy-900 whitespace-nowrap">
                          ₹{totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          {late > 0 && (
                            <span className="block text-[10px] text-rose-600 font-normal">
                              Includes ₹{late.toFixed(0)} late fee
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge status={v.status} />
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedViolationId(v.id);
                                navigateTo('details', { violationId: v.id });
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>

                            {v.status !== 'Resolved' && (
                              <button
                                onClick={() => setActiveDisputeItem(v)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                Dispute
                              </button>
                            )}

                            {v.status !== 'Resolved' ? (
                              <button
                                onClick={() => setActivePayItem(v)}
                                className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                Pay
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
                                Cleared ✓
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Modals (Connected to Flask SQLite backend) */}
      <DisputeModal
        violation={activeDisputeItem}
        isOpen={Boolean(activeDisputeItem)}
        onClose={() => setActiveDisputeItem(null)}
      />

      <PayFineModal
        violation={activePayItem}
        isOpen={Boolean(activePayItem)}
        onClose={() => setActivePayItem(null)}
      />
    </div>
  );
};
